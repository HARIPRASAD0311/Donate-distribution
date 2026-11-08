from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.facility import Facility
from backend.app.schemas.tier_a import FacilitySchema

router = APIRouter()

@router.get("", response_model=List[FacilitySchema])
def list_facilities(db: Session = Depends(get_db)):
    """List all logistics facilities, staging depots, and forward bases."""
    return list(db.scalars(select(Facility)).all())

@router.get("/{facility_id}", response_model=FacilitySchema)
def get_facility(facility_id: str, db: Session = Depends(get_db)):
    """Retrieve facility by id or code."""
    fac = db.scalar(select(Facility).where(or_(Facility.id == facility_id, Facility.code == facility_id)))
    if not fac:
        raise HTTPException(status_code=404, detail=f"Facility '{facility_id}' not found.")
    return fac
