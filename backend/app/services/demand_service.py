from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.demand import DemandRecord, BeneficiaryGroup
from backend.app.schemas.tier_a import VerifyDemandRequest
from backend.app.services.audit_service import log_audit_event

def get_demand_records(
    session: Session,
    priority: Optional[str] = None,
    commodity: Optional[str] = None,
    verification_status: Optional[str] = None,
) -> List[DemandRecord]:
    stmt = select(DemandRecord)
    if priority and priority != "ALL":
        stmt = stmt.where(DemandRecord.priority == priority)
    if commodity and commodity != "ALL":
        stmt = stmt.where(DemandRecord.commodity == commodity)
    if verification_status and verification_status != "ALL":
        stmt = stmt.where(DemandRecord.verification_status == verification_status)
    return list(session.scalars(stmt).all())

def get_beneficiary_groups(
    session: Session,
    region: Optional[str] = None,
) -> List[BeneficiaryGroup]:
    stmt = select(BeneficiaryGroup)
    if region and region != "ALL":
        stmt = stmt.where(BeneficiaryGroup.region == region)
    return list(session.scalars(stmt).all())

def verify_demand_record(session: Session, req: VerifyDemandRequest) -> DemandRecord:
    # Find demand record (matching id)
    demand = session.scalar(select(DemandRecord).where(DemandRecord.id == req.demand_id))
    if not demand:
        raise HTTPException(status_code=404, detail=f"Demand record '{req.demand_id}' not found.")
        
    if demand.verification_status == "VERIFIED":
        return demand # Idempotent verification
        
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    prev_status = demand.verification_status
    
    demand.verification_status = "VERIFIED"
    demand.verification_details_json = {
        "verifiedBy": req.verified_by,
        "verifiedAt": now_iso,
        "evidenceRef": req.evidence_ref,
        "notes": req.notes,
    }
    
    # Log Audit Event
    log_audit_event(
        session=session,
        user=req.verified_by,
        role="Field Verifier",
        action="DEMAND_VERIFIED",
        module="Demand & Beneficiaries",
        entity_id=demand.id,
        status="VERIFIED",
        previous_value=prev_status,
        new_value="VERIFIED",
        reason=req.notes,
        evidence_ref=req.evidence_ref,
        is_simulated=True,
    )
    
    session.commit()
    session.refresh(demand)
    return demand
