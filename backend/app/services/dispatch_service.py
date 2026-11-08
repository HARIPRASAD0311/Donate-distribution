from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.dispatch import DispatchOrder, DeliveryRecord
from backend.app.models.allocation import AllocationPlan, AllocationLine
from backend.app.models.demand import DemandRecord
from backend.app.models.geography import TransportRoute
from backend.app.schemas.tier_a import CreateDispatchOrderRequest, VerifyPodRequest
from backend.app.services.audit_service import log_audit_event

def get_dispatch_orders(
    session: Session,
    status: Optional[str] = None,
    commodity: Optional[str] = None,
) -> List[DispatchOrder]:
    stmt = select(DispatchOrder)
    if status and status != "ALL":
        stmt = stmt.where(DispatchOrder.status == status)
    if commodity and commodity != "ALL":
        stmt = stmt.where(DispatchOrder.commodity == commodity)
    return list(session.scalars(stmt).all())

def create_dispatch_order(session: Session, req: CreateDispatchOrderRequest) -> DispatchOrder:
    # 1. HARD RULE: Check plan is approved (nothing is dispatched without human approval)
    plan = session.scalar(select(AllocationPlan).where(AllocationPlan.id == req.plan_id))
    if not plan:
        raise HTTPException(status_code=404, detail=f"Allocation plan '{req.plan_id}' not found.")
    if plan.status != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot dispatch against plan '{req.plan_id}' with status '{plan.status}'. Human approval required."
        )

    # 2. HARD RULE: Check route is not blocked (blocked/unsafe routes are never usable)
    route = session.scalar(select(TransportRoute).where(or_(TransportRoute.name == req.route_name, TransportRoute.id == req.route_name)))
    if route and (route.is_blocked or route.status == "BLOCKED"):
        raise HTTPException(
            status_code=400,
            detail=f"Route '{req.route_name}' is currently BLOCKED / impassable. Rerouting required before dispatch."
        )

    # 3. Find active allocation line
    line = session.scalar(select(AllocationLine).where(AllocationLine.plan_id == req.plan_id))
    if not line:
        raise HTTPException(status_code=400, detail=f"No allocation lines found for plan '{req.plan_id}'.")

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    order_id = req.id or f"DSP-{int(datetime.now().timestamp() * 1000)}"

    order = DispatchOrder(
        id=order_id,
        plan_id=req.plan_id,
        allocation_id=line.id,
        source_facility_name="Central Staging Depot (CSD-01)",
        source_id=line.source_facility_id,
        source_coords_json=[26.1224, 91.5668],
        destination_name=req.destination_name or "Emergency Settlement Sector",
        destination_id=req.destination_id,
        dest_coords_json=[26.11592, 91.51712],
        current_coords_json=[26.1224, 91.5668],
        commodity=line.commodity,
        item=line.item,
        batch_id=line.lot_id,
        quantity=line.quantity - line.dispatched_quantity,
        unit=line.unit,
        vehicle=req.vehicle,
        vehicle_type=req.vehicle_type,
        carrier=req.carrier,
        driver=req.driver,
        route_name=req.route_name,
        route_status="PASSABLE_WATERWAY" if "river" in req.route_name.lower() or "barge" in req.vehicle.lower() else "PASSABLE",
        dispatched_at=now_iso,
        expected_arrival=req.expected_arrival,
        status="IN_TRANSIT",
        progress_pct=15.0,
        pod_json=None,
        notes=req.notes,
        source="DISPATCH_COORDINATION_ENGINE",
        observed_at=now_iso,
        received_at=now_iso,
        verification_status="VERIFIED",
        submitted_by=req.actor,
        is_simulated=True,
    )
    session.add(order)

    # Update allocation line dispatched quantity
    line.dispatched_quantity = line.quantity
    line.status = "CONSUMED"

    # Log Audit Event
    log_audit_event(
        session=session,
        user=req.actor,
        role="Dispatch Officer",
        action="DISPATCH_ORDER_CREATED",
        module="Dispatch & Verification",
        entity_id=order_id,
        status="IN_TRANSIT",
        previous_value="RESERVED",
        new_value=f"{order.quantity} {order.unit} Dispatched via {order.vehicle}",
        reason=req.notes or "Convoy departure approved",
        approval_ref=req.plan_id,
        is_simulated=True,
    )

    session.commit()
    session.refresh(order)
    return order

def verify_proof_of_delivery(session: Session, req: VerifyPodRequest) -> DispatchOrder:
    order = session.scalar(select(DispatchOrder).where(DispatchOrder.id == req.dispatch_id))
    if not order:
        raise HTTPException(status_code=404, detail=f"Dispatch order '{req.dispatch_id}' not found.")
        
    if order.status == "VERIFIED":
        return order # Idempotent

    # 1. Reconciliation check
    total_reconciled = req.accepted_quantity + req.damaged_quantity + req.rejected_quantity + req.adjusted_quantity
    if total_reconciled != req.received_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Reconciliation error: Accepted({req.accepted_quantity}) + Damaged({req.damaged_quantity}) + "
                   f"Rejected({req.rejected_quantity}) + Adjusted({req.adjusted_quantity}) = {total_reconciled} "
                   f"does not equal Received({req.received_quantity})."
        )
        
    if req.adjusted_quantity > 0 and not req.adjustment_reason:
        raise HTTPException(status_code=400, detail="Documented adjustment reason is required when adjustedQuantity > 0.")

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    del_id = req.delivery_id or f"DEL-{int(datetime.now().timestamp() * 1000)}"

    # 2. Record DeliveryRecord
    delivery = DeliveryRecord(
        id=del_id,
        dispatch_id=order.id,
        destination_facility_id=order.destination_id,
        received_quantity=req.received_quantity,
        accepted_quantity=req.accepted_quantity,
        damaged_quantity=req.damaged_quantity,
        rejected_quantity=req.rejected_quantity,
        adjusted_quantity=req.adjusted_quantity,
        adjustment_reason=req.adjustment_reason,
        verified_at=now_iso,
        verified_by=req.verified_by,
        evidence_ref=req.evidence_ref,
        notes=req.notes,
        source="DESTINATION_POD_INSPECTOR",
        observed_at=now_iso,
        received_at=now_iso,
        verification_status="VERIFIED",
        submitted_by=req.verified_by,
        is_simulated=True,
    )
    session.add(delivery)

    # 3. Update DispatchOrder
    order.status = "VERIFIED"
    order.progress_pct = 100.0
    order.delivered_at = now_iso
    order.verified_at = now_iso
    order.pod_json = {
        "deliveryId": del_id,
        "verifiedBy": req.verified_by,
        "evidenceRef": req.evidence_ref,
        "acceptedQty": req.accepted_quantity,
        "damagedQty": req.damaged_quantity,
        "rejectedQty": req.rejected_quantity,
        "adjustedQty": req.adjusted_quantity,
        "verifiedAt": now_iso,
    }

    # 4. Fulfil linked demand (HARD RULE: only accepted quantity fulfils demand)
    line = session.scalar(select(AllocationLine).where(AllocationLine.id == order.allocation_id)) if order.allocation_id else None
    if line and line.demand_id:
        demand = session.scalar(select(DemandRecord).where(DemandRecord.id == line.demand_id))
        if demand:
            demand.fulfilled_quantity = min(demand.quantity, demand.fulfilled_quantity + req.accepted_quantity)
            demand.remaining_quantity = max(0.0, demand.quantity - demand.fulfilled_quantity)

    # 5. Log Audit Event
    log_audit_event(
        session=session,
        user=req.verified_by,
        role="Destination Verifier",
        action="POD_VERIFIED",
        module="Dispatch & Verification",
        entity_id=order.id,
        status="VERIFIED",
        previous_value="IN_TRANSIT",
        new_value=f"VERIFIED (Accepted: {req.accepted_quantity} {order.unit})",
        reason=req.notes or "Physical proof-of-delivery inspected and certified",
        evidence_ref=req.evidence_ref,
        is_simulated=True,
    )

    session.commit()
    session.refresh(order)
    return order

def depart_dispatch_order(
    session: Session,
    dispatch_id: str,
    actor: str = "Convoy Commander",
    notes: Optional[str] = None
) -> DispatchOrder:
    order = session.scalar(select(DispatchOrder).where(DispatchOrder.id == dispatch_id))
    if not order:
        raise HTTPException(status_code=404, detail=f"Dispatch order '{dispatch_id}' not found.")
    
    if order.status == "IN_TRANSIT":
        return order

    prev_status = order.status
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    order.status = "IN_TRANSIT"
    order.dispatched_at = now_iso
    order.progress_pct = max(order.progress_pct, 25.0)

    log_audit_event(
        session=session,
        user=actor,
        role="Convoy Commander",
        action="DISPATCH_DEPARTED",
        module="Dispatch & Verification",
        entity_id=order.id,
        status="IN_TRANSIT",
        previous_value=prev_status,
        new_value="IN_TRANSIT",
        reason=notes or "Convoy departed staging facility",
        is_simulated=True,
    )

    session.commit()
    session.refresh(order)
    return order

def record_dispatch_arrival(
    session: Session,
    dispatch_id: str,
    actor: str = "Destination Receptionist",
    notes: Optional[str] = None
) -> DispatchOrder:
    order = session.scalar(select(DispatchOrder).where(DispatchOrder.id == dispatch_id))
    if not order:
        raise HTTPException(status_code=404, detail=f"Dispatch order '{dispatch_id}' not found.")

    if order.status in ("ARRIVED_AWAITING_POD", "DELIVERED", "VERIFIED"):
        return order

    prev_status = order.status
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    order.status = "ARRIVED_AWAITING_POD"
    order.actual_arrival = now_iso
    order.progress_pct = 90.0

    log_audit_event(
        session=session,
        user=actor,
        role="Destination Receptionist",
        action="DISPATCH_ARRIVED",
        module="Dispatch & Verification",
        entity_id=order.id,
        status="ARRIVED_AWAITING_POD",
        previous_value=prev_status,
        new_value="ARRIVED_AWAITING_POD",
        reason=notes or "Shipment physically reached destination gate; awaiting POD verification",
        is_simulated=True,
    )

    session.commit()
    session.refresh(order)
    return order

def reroute_dispatch_order(
    session: Session,
    dispatch_id: str,
    new_route_name: str,
    justification: str,
    actor: str = "Dispatch Operator"
) -> DispatchOrder:
    order = session.scalar(select(DispatchOrder).where(DispatchOrder.id == dispatch_id))
    if not order:
        raise HTTPException(status_code=404, detail=f"Dispatch order '{dispatch_id}' not found.")

    # HARD RULE: Blocked routes cannot be used
    route = session.scalar(
        select(TransportRoute).where(
            or_(TransportRoute.name == new_route_name, TransportRoute.id == new_route_name)
        )
    )
    if route and (route.is_blocked or route.status == "BLOCKED"):
        raise HTTPException(
            status_code=400,
            detail=f"Proposed alternative route '{new_route_name}' is currently BLOCKED ({route.blockage_reason or 'Impassable'}). Cannot reroute."
        )

    prev_route = order.route_name
    order.route_name = new_route_name
    order.route_status = "PASSABLE_WATERWAY" if "river" in new_route_name.lower() or "barge" in new_route_name.lower() else "PASSABLE"
    order.exception_reason = None

    log_audit_event(
        session=session,
        user=actor,
        role="Dispatch Operator",
        action="DISPATCH_REROUTED",
        module="Dispatch & Verification",
        entity_id=order.id,
        status=order.status,
        previous_value=prev_route,
        new_value=new_route_name,
        reason=justification,
        is_simulated=True,
    )

    session.commit()
    session.refresh(order)
    return order


