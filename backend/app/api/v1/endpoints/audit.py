import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.audit import AuditEvent
from backend.app.schemas.tier_a import AuditEventSchema

router = APIRouter()

@router.get("/events", response_model=List[AuditEventSchema])
def list_audit_events(
    module: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve immutable operational event ledger."""
    stmt = select(AuditEvent).order_by(desc(AuditEvent.timestamp)).limit(limit)
    if module and module != "ALL":
        stmt = stmt.where(AuditEvent.module == module)
    if action and action != "ALL":
        stmt = stmt.where(AuditEvent.action == action)
    return list(db.scalars(stmt).all())

@router.get("/export")
def export_audit_log(
    format: str = Query("csv", pattern="^(csv|tsv)$"),
    db: Session = Depends(get_db),
):
    """Stream RFC-4180 compliant CSV/TSV export of the audit trail."""
    events = list(db.scalars(select(AuditEvent).order_by(AuditEvent.timestamp)).all())
    
    fieldnames = [
        "id", "timestamp", "user", "role", "action", "module",
        "entityId", "status", "previousValue", "newValue", "reason",
        "approvalRef", "evidenceRef", "isSimulated"
    ]
    
    delimiter = "\t" if format == "tsv" else ","
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter=delimiter, lineterminator="\r\n")
    writer.writeheader()
    
    for e in events:
        writer.writerow({
            "id": e.id,
            "timestamp": e.timestamp,
            "user": e.user,
            "role": e.role,
            "action": e.action,
            "module": e.module,
            "entityId": e.entity_id,
            "status": e.status,
            "previousValue": e.previous_value or "",
            "newValue": e.new_value or "",
            "reason": e.reason,
            "approvalRef": e.approval_ref or "",
            "evidenceRef": e.evidence_ref or "",
            "isSimulated": str(e.is_simulated).lower(),
        })
        
    media_type = "text/tab-separated-values" if format == "tsv" else "text/csv"
    filename = f"resqnet-audit-events.{format}"
    
    return Response(
        content=output.getvalue(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
