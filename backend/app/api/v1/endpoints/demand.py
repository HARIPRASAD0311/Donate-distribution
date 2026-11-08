from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.tier_a import (
    BeneficiaryGroupSchema,
    DemandRecordSchema,
    VerifyDemandRequest,
)
from backend.app.services.demand_service import (
    get_demand_records,
    get_beneficiary_groups,
    verify_demand_record,
)

router = APIRouter()

@router.get("/beneficiaries", response_model=List[BeneficiaryGroupSchema])
def list_beneficiaries(
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve vulnerable population communities and camps."""
    return get_beneficiary_groups(session=db, region=region)

@router.get("/records", response_model=List[DemandRecordSchema])
def list_demands(
    priority: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    verificationStatus: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve demand records with remaining deficit tracking."""
    return get_demand_records(
        session=db,
        priority=priority,
        commodity=commodity,
        verification_status=verificationStatus,
    )

@router.post("/verify", response_model=DemandRecordSchema)
def verify_demand(
    req: VerifyDemandRequest,
    db: Session = Depends(get_db),
):
    """Certify and verify a humanitarian demand with evidence reference."""
    return verify_demand_record(session=db, req=req)
