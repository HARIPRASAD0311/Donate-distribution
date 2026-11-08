from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_a import (
    DispatchOrderSchema,
    CreateDispatchOrderRequest,
    VerifyPodRequest,
    DepartDispatchRequest,
    RecordArrivalRequest,
    RerouteDispatchRequest,
)
from backend.app.services.dispatch_service import (
    get_dispatch_orders,
    create_dispatch_order,
    verify_proof_of_delivery,
    depart_dispatch_order,
    record_dispatch_arrival,
    reroute_dispatch_order,
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

@router.post("/{dispatch_id}/depart", response_model=DispatchOrderSchema)
def depart_dispatch(
    dispatch_id: str,
    req: DepartDispatchRequest,
    db: Session = Depends(get_db),
):
    """Transition dispatch order from READY/PREPARING to IN_TRANSIT."""
    return depart_dispatch_order(session=db, dispatch_id=dispatch_id, actor=req.actor, notes=req.notes)

@router.post("/{dispatch_id}/arrive", response_model=DispatchOrderSchema)
def arrive_dispatch(
    dispatch_id: str,
    req: RecordArrivalRequest,
    db: Session = Depends(get_db),
):
    """Record physical arrival of shipment at destination gate awaiting inspection."""
    return record_dispatch_arrival(session=db, dispatch_id=dispatch_id, actor=req.actor, notes=req.notes)

@router.post("/{dispatch_id}/reroute", response_model=DispatchOrderSchema)
def reroute_dispatch(
    dispatch_id: str,
    req: RerouteDispatchRequest,
    db: Session = Depends(get_db),
):
    """Reroute in-transit dispatch to avoid physical washouts and record AuditEvent."""
    return reroute_dispatch_order(
        session=db,
        dispatch_id=dispatch_id,
        new_route_name=req.new_route_name,
        justification=req.justification,
        actor=req.actor,
    )


