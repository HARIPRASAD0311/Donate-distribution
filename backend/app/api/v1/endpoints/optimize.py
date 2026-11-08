from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_c import (
    OptimizationValidationInput,
    ValidationReportSchema,
    OptimizationJobConfig,
    OptimizationExecutionResponse,
    AllocationPlanDetailSchema,
    PlanApprovalRequest,
    PlanRejectRequest,
)
from backend.app.services.optimization_engine import (
    validate_optimization_inputs,
    solve_allocation_milp,
)
from backend.app.services.allocation_service import (
    approve_plan,
    reject_plan,
    get_plan_history,
)

router = APIRouter()

@router.post("/validate", response_model=ValidationReportSchema)
def validate_inputs(
    payload: OptimizationValidationInput,
    db: Session = Depends(get_db)
):
    """
    Validates optimization inputs, physical constraints, and network corridor feasibility.
    Checks commodities, source depots, reserve margins, and route passability.
    """
    return validate_optimization_inputs(db, payload)

@router.post("/milp", response_model=OptimizationExecutionResponse)
def execute_milp(
    job_config: OptimizationJobConfig,
    db: Session = Depends(get_db)
):
    """
    Executes the Pyomo + HiGHS optimization solver for humanitarian resource allocation.
    Solves strictly for the certified FOOD commodity stream.
    """
    return solve_allocation_milp(db, job_config)

@router.post("/plans/{plan_id}/approve", response_model=AllocationPlanDetailSchema)
def approve_allocation_plan(
    plan_id: str,
    request: PlanApprovalRequest,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop operational sign-off:
    Marks plan as APPROVED, atomically commits stock reservations to InventoryLots,
    and appends an immutable AuditEvent.
    """
    return approve_plan(db, plan_id, request)

@router.post("/plans/{plan_id}/reject", response_model=AllocationPlanDetailSchema)
def reject_allocation_plan(
    plan_id: str,
    request: PlanRejectRequest,
    db: Session = Depends(get_db)
):
    """
    Rejects candidate allocation plan, releases stock holds, and appends an AuditEvent.
    """
    return reject_plan(db, plan_id, request)

@router.get("/plans/history", response_model=List[AllocationPlanDetailSchema])
def list_plan_history(
    incident_id: Optional[str] = Query(default=None, alias="incidentId"),
    db: Session = Depends(get_db)
):
    """
    Retrieves historical versions, seeded benchmark runs, and approval records for plans.
    """
    return get_plan_history(db, incident_id)

