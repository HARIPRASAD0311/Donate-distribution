from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_b import CommandCenterPayloadSchema
from backend.app.services.analytics_service import get_command_center_payload

router = APIRouter()

@router.get("", response_model=CommandCenterPayloadSchema)
def get_command_center(
    incident_id: str = Query(default="INC-2026-0412", alias="incidentId"),
    db: Session = Depends(get_db)
):
    """
    Retrieve full dynamic Tier B Command Center operational telemetry.
    Accepts optional incidentId query parameter.
    """
    return get_command_center_payload(db, incident_id)

