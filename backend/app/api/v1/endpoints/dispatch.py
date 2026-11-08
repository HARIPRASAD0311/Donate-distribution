from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_a import (
    DispatchOrderSchema,
    CreateDispatchOrderRequest,
    VerifyPodRequest,
)
from backend.app.services.dispatch_service import (
    get_dispatch_orders,
    create_dispatch_order,
    verify_proof_of_delivery,
)

router = APIRouter()

@router.get("/orders", response_model=List[DispatchOrderSchema])
def list_dispatches(
    status: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve dispatch convoys, transit statuses, and progress tracking."""
    return get_dispatch_orders(session=db, status=status, commodity=commodity)

@router.post("/create", response_model=DispatchOrderSchema, status_code=201)
def create_dispatch(
    req: CreateDispatchOrderRequest,
    db: Session = Depends(get_db),
):
    """Create a new dispatch order against an approved plan."""
    return create_dispatch_order(session=db, req=req)

@router.post("/verify-pod", response_model=DispatchOrderSchema)
def verify_pod(
    req: VerifyPodRequest,
    db: Session = Depends(get_db),
):
    """Verify physical delivery and reconcile accepted/damaged/rejected quantities."""
    return verify_proof_of_delivery(session=db, req=req)
