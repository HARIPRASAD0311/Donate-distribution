from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_c_recovery import (
    SimulationConfigSchema,
    SimulationResponseSchema,
    ActionValidationRequestSchema,
    ActionValidationResponseSchema,
    StrategyApprovalRequestSchema,
    RecoveryStrategySchema,
)
from backend.app.services.recovery_simulator import (
    run_recovery_simulation,
    validate_recovery_action,
    approve_recovery_strategy,
)

router = APIRouter()

@router.post("/simulate", response_model=SimulationResponseSchema)
def simulate_recovery(
    config: SimulationConfigSchema,
    db: Session = Depends(get_db)
):
    """
    Executes a SimPy discrete-event Monte Carlo simulation for network disruption recovery.
    Quantifies the 95% CVaR risk tail, service level histograms, and recovery timelines.
    """
    return run_recovery_simulation(db, config)

@router.post("/validate-action", response_model=ActionValidationResponseSchema)
def validate_action(
    request: ActionValidationRequestSchema,
    db: Session = Depends(get_db)
):
    """
    Validates a proposed recovery intervention (reroute, barge activation, air-sling)
    against live network topology and corridor passability.
    """
    return validate_recovery_action(db, request)

@router.post("/strategies/{strategy_id}/approve", response_model=RecoveryStrategySchema)
def approve_strategy(
    strategy_id: str,
    request: StrategyApprovalRequestSchema,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop recovery strategy approval with STALE BASELINE CHECK.
    Rejects sign-off if baseline operational state transitioned since simulation was computed.
    """
    return approve_recovery_strategy(db, strategy_id, request)

