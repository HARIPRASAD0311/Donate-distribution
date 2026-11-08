from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.geography import GeographicLocation, TransportRoute, DisasterZone
from backend.app.schemas.tier_a import GeographicLocationSchema, TransportRouteSchema, DisasterZoneSchema

router = APIRouter()

@router.get("/locations", response_model=List[GeographicLocationSchema])
def list_geographic_locations(
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all GIS points of interest."""
    stmt = select(GeographicLocation)
    if type and type != "ALL":
        stmt = stmt.where(GeographicLocation.type == type)
    return list(db.scalars(stmt).all())

@router.get("/routes", response_model=List[TransportRouteSchema])
def list_transport_routes(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve transportation corridors and waypoints."""
    stmt = select(TransportRoute)
    if status and status != "ALL":
        stmt = stmt.where(TransportRoute.status == status)
    return list(db.scalars(stmt).all())

@router.get("/disaster-zones", response_model=List[DisasterZoneSchema])
def list_disaster_zones(
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve flood inundation and hazard zones with GeoJSON polygons."""
    stmt = select(DisasterZone)
    if severity and severity != "ALL":
        stmt = stmt.where(DisasterZone.severity == severity)
    return list(db.scalars(stmt).all())
