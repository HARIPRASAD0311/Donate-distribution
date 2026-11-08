from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.incident import Incident
from backend.app.schemas.tier_a import IncidentSchema
from backend.app.schemas.tier_b import CommandCenterPayloadSchema
from backend.app.services.analytics_service import get_command_center_payload

router = APIRouter()

@router.get("", response_model=List[IncidentSchema])
def list_incidents(db: Session = Depends(get_db)):
    """List all disaster response incidents."""
    return list(db.scalars(select(Incident)).all())

@router.get("/{incident_id}", response_model=IncidentSchema)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific incident."""
    incident = db.scalar(select(Incident).where(Incident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return incident

@router.get("/{incident_id}/command-center", response_model=CommandCenterPayloadSchema)
def get_incident_command_center(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve full dynamic Tier B Command Center operational telemetry."""
    incident = db.scalar(select(Incident).where(Incident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return get_command_center_payload(db, incident_id)


