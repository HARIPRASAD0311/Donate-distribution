from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.models.inventory import InventoryLot, InventoryTransaction
from backend.app.models.facility import Facility
from backend.app.schemas.tier_a import ReceiveStockRequest, QuarantineLotRequest
from backend.app.services.audit_service import log_audit_event

def get_inventory_lots(
    session: Session,
    facility_id: Optional[str] = None,
    commodity: Optional[str] = None,
    quality_status: Optional[str] = None,
) -> List[InventoryLot]:
    stmt = select(InventoryLot)
    if facility_id and facility_id != "ALL":
        stmt = stmt.where(InventoryLot.facility_id == facility_id)
    if commodity and commodity != "ALL":
        stmt = stmt.where(InventoryLot.commodity == commodity)
    if quality_status and quality_status != "ALL":
        stmt = stmt.where(InventoryLot.quality_status == quality_status)
        
    lots = list(session.scalars(stmt).all())
    
    # Recalculate days_to_expiry dynamically relative to scenario reference clock
    base_date = settings.SCENARIO_NOW.date()
    for lot in lots:
        if lot.expiry_date:
            try:
                exp_date = datetime.strptime(lot.expiry_date, "%Y-%m-%d").date()
                lot.days_to_expiry = (exp_date - base_date).days
            except ValueError:
                pass
    return lots

def receive_inventory_stock(session: Session, req: ReceiveStockRequest) -> InventoryLot:
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")
        
    # Check facility
    fac = session.scalar(select(Facility).where(or_(Facility.id == req.facility_id, Facility.code == req.facility_id)))
    facility_name = fac.name if fac else (req.facility_name or req.facility_id)
    facility_id = fac.code if fac else req.facility_id
    
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    lot_id = req.id or f"LOT-{int(datetime.now().timestamp() * 1000)}"
    
    # Check duplicate
    existing = session.scalar(select(InventoryLot).where(InventoryLot.id == lot_id))
    if existing:
        raise HTTPException(status_code=400, detail=f"Inventory lot with ID '{lot_id}' already exists.")

    usable_qty = req.quantity if req.quality_status == "VERIFIED_USABLE" else 0.0
    quarantined_qty = req.quantity if req.quality_status == "QUARANTINED" else 0.0
    
    # Calculate days to expiry
    days_to_expiry = None
    if req.expiry_date:
        try:
            exp_date = datetime.strptime(req.expiry_date, "%Y-%m-%d").date()
            days_to_expiry = (exp_date - settings.SCENARIO_NOW.date()).days
        except ValueError:
            pass

    lot = InventoryLot(
        id=lot_id,
        name=req.name,
        commodity=req.commodity.upper(),
        category=req.category,
        batch_id=req.batch_id,
        facility_id=facility_id,
        facility_name=facility_name,
        total_qty=req.quantity,
        reserved_qty=0.0,
        usable_qty=usable_qty,
        quarantined_qty=quarantined_qty,
        unit=req.unit,
        expiry_date=req.expiry_date,
        days_to_expiry=days_to_expiry,
        quality_status=req.quality_status,
        storage_location=req.storage_location,
        source=req.source,
        received_date=now_iso[:10],
        received_qty=req.quantity,
        fefo_eligible=(usable_qty > 0),
        quality_record_json={"status": req.quality_status, "intakeAt": now_iso},
        movement_history_json=[{"date": now_iso[:10], "action": "RECEIPT", "qty": req.quantity, "user": req.actor}],
        observed_at=now_iso,
        received_at=now_iso,
        verification_status="VERIFIED",
        submitted_by=req.actor,
        is_simulated=True,
    )
    session.add(lot)
    
    # Ingest Transaction
    tx = InventoryTransaction(
        id=f"TX-{lot_id}-RECEIPT",
        lot_id=lot_id,
        type="RECEIPT",
        quantity=req.quantity,
        unit=req.unit,
        commodity=req.commodity.upper(),
        occurred_at=now_iso,
        actor=req.actor,
        reason=req.reason,
        source="INVENTORY_SERVICE",
        is_simulated=True,
    )
    session.add(tx)
    
    # Log Audit Event
    log_audit_event(
        session=session,
        user=req.actor,
        role="Intake Logistics Officer",
        action="STOCK_RECEIVED",
        module="Resources & Inventory",
        entity_id=lot_id,
        status="RECORDED",
        previous_value="NOT_RECEIVED",
        new_value=f"{req.quantity} {req.unit} ({req.quality_status})",
        reason=req.reason,
        evidence_ref=req.batch_id,
        is_simulated=True,
    )
    
    session.commit()
    session.refresh(lot)
    return lot

def quarantine_inventory_lot(session: Session, req: QuarantineLotRequest) -> InventoryLot:
    lot = session.scalar(select(InventoryLot).where(InventoryLot.id == req.lot_id))
    if not lot:
        raise HTTPException(status_code=404, detail=f"Inventory lot '{req.lot_id}' not found.")
    
    if lot.quality_status == "QUARANTINED":
        raise HTTPException(status_code=400, detail=f"Lot '{req.lot_id}' is already quarantined.")
        
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    prev_status = lot.quality_status
    prev_usable = lot.usable_qty
    
    lot.quality_status = "QUARANTINED"
    lot.quarantined_qty = lot.total_qty - lot.reserved_qty
    lot.usable_qty = 0.0
    lot.fefo_eligible = False
    
    # Append to movement history
    history = list(lot.movement_history_json or [])
    history.append({"date": now_iso[:10], "action": "QUARANTINE", "qty": lot.quarantined_qty, "user": req.actor})
    lot.movement_history_json = history
    
    # Add transaction
    tx = InventoryTransaction(
        id=f"TX-{lot.id}-QUARANTINE-{int(datetime.now().timestamp())}",
        lot_id=lot.id,
        type="QUARANTINE",
        quantity=lot.quarantined_qty,
        unit=lot.unit,
        commodity=lot.commodity,
        occurred_at=now_iso,
        actor=req.actor,
        reason=req.reason,
        source="QUALITY_CONTROL_SERVICE",
        is_simulated=True,
    )
    session.add(tx)
    
    # Log audit event
    log_audit_event(
        session=session,
        user=req.actor,
        role="QA Officer",
        action="STOCK_QUARANTINED",
        module="Resources & Inventory",
        entity_id=lot.id,
        status="QUARANTINED",
        previous_value=f"{prev_status} (usable: {prev_usable})",
        new_value=f"QUARANTINED (quarantined: {lot.quarantined_qty})",
        reason=req.reason,
        evidence_ref="QA-INSPECTION-NOTICE",
        is_simulated=True,
    )
    
    session.commit()
    session.refresh(lot)
    return lot
