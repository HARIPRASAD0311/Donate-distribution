from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    incidents,
    command_center,
    facilities,
    geography,
    inventory,
    demand,
    optimize,
    recovery,
    dispatch,
    audit,
    scenario,
)

api_router = APIRouter()

api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(command_center.router, prefix="/command-center", tags=["Command Center"])
api_router.include_router(facilities.router, prefix="/facilities", tags=["Facilities"])
api_router.include_router(geography.router, prefix="/geography", tags=["Geography & GIS"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Resources"])
api_router.include_router(demand.router, prefix="/demand", tags=["Demand & Beneficiaries"])
api_router.include_router(optimize.router, prefix="/optimize", tags=["Allocation & Optimization"])
api_router.include_router(recovery.router, prefix="/recovery", tags=["Recovery Simulator"])
api_router.include_router(dispatch.router, prefix="/dispatch", tags=["Dispatch & POD"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit & Reports"])
api_router.include_router(scenario.router, prefix="/scenario", tags=["Scenario & Telemetry"])

