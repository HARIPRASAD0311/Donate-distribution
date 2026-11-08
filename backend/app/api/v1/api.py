from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    incidents,
    facilities,
    geography,
    inventory,
    demand,
    dispatch,
    audit,
)

api_router = APIRouter()

api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(facilities.router, prefix="/facilities", tags=["Facilities"])
api_router.include_router(geography.router, prefix="/geography", tags=["Geography & GIS"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Resources"])
api_router.include_router(demand.router, prefix="/demand", tags=["Demand & Beneficiaries"])
api_router.include_router(dispatch.router, prefix="/dispatch", tags=["Dispatch & POD"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit & Reports"])
