from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_a import (
    InventoryLotSchema,
    ReceiveStockRequest,
    QuarantineLotRequest,
)
from backend.app.services.inventory_service import (
    get_inventory_lots,
    receive_inventory_stock,
    quarantine_inventory_lot,
)

router = APIRouter()

@router.get("/lots", response_model=List[InventoryLotSchema])
def list_lots(
    facilityId: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    qualityStatus: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve inventory lots with dynamic shelf-life calculation."""
    return get_inventory_lots(
        session=db,
        facility_id=facilityId,
        commodity=commodity,
        quality_status=qualityStatus,
    )

@router.post("/receive", response_model=InventoryLotSchema, status_code=201)
def receive_stock(
    req: ReceiveStockRequest,
    db: Session = Depends(get_db),
):
    """Record receipt of a new inventory batch/lot with transaction and audit event."""
    return receive_inventory_stock(session=db, req=req)

@router.post("/quarantine", response_model=InventoryLotSchema)
def quarantine_lot(
    req: QuarantineLotRequest,
    db: Session = Depends(get_db),
):
    """Move inventory lot into quarantine hold and emit an audit event."""
    return quarantine_inventory_lot(session=db, req=req)
