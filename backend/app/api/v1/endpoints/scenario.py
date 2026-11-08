from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.incident import Incident
from backend.app.models.audit import AuditEvent
from backend.app.schemas.scenario import ScenarioStatusSchema, ScenarioClockSchema

router = APIRouter()

@router.get("/status", response_model=ScenarioStatusSchema)
@router.get("/metadata", response_model=ScenarioStatusSchema)
def get_scenario_status(db: Session = Depends(get_db)):
    """
    Returns current scenario clock (SCENARIO_NOW), active crisis scope,
    simulation/solver engine metadata, and data freshness telemetry.
    """
    flood_incident = db.scalar(select(Incident).where(Incident.crisis_type == "Flood"))
    if not flood_incident:
        flood_incident = db.scalar(select(Incident))

    last_audit = db.scalar(select(AuditEvent).order_by(AuditEvent.timestamp.desc()))
    last_import = last_audit.timestamp if last_audit else None

    return ScenarioStatusSchema(
        scenarioNow=settings.SCENARIO_NOW_STR,
        activeIncidentId=flood_incident.id if flood_incident else "INC-2026-0412",
        activeIncidentName=flood_incident.name if flood_incident else "Brahmaputra Monsoon Floods",
        crisisType=flood_incident.crisis_type if flood_incident else "Flood",
        region=flood_incident.region if flood_incident else "Assam Brahmaputra Flood Response",
        isSupported=True,
        dataFreshness="SYNCHRONIZED_WITH_SCENARIO_CLOCK",
        demoWatermark="SYNTHETIC BENCHMARK DATA — FLOOD EMERGENCY RESPONSE",
        systemVersion="2.5.0-HiGHS-SimPy",
        supportedCommodities=["FOOD"],
        commodityValidationScope="FOOD certified; WATER and MEDICAL stored and visible but marked 'not validated'.",
        optimizationEngine="Pyomo 6.10 + HiGHS 1.15",
        simulationEngine="SimPy 4.1 + Monte Carlo & CVaR (95%)",
        lastDataImport=last_import
    )

@router.get("/now", response_model=ScenarioClockSchema)
def get_scenario_now():
    """Returns the scenario anchor clock reference time."""
    return ScenarioClockSchema(scenarioNow=settings.SCENARIO_NOW_STR)
