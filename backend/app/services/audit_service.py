import time
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.audit import AuditEvent

def log_audit_event(
    session: Session,
    user: str,
    role: str,
    action: str,
    module: str,
    entity_id: str,
    status: str,
    reason: str,
    previous_value: Optional[str] = None,
    new_value: Optional[str] = None,
    approval_ref: Optional[str] = None,
    evidence_ref: Optional[str] = None,
    related_events: Optional[List[str]] = None,
    is_simulated: bool = True,
) -> AuditEvent:
    """Creates and appends an immutable AuditEvent to the session."""
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    event_id = f"EVT-{int(time.time() * 1000)}"
    
    event = AuditEvent(
        id=event_id,
        timestamp=now_iso,
        user=user,
        role=role,
        action=action,
        module=module,
        entity_id=entity_id,
        status=status,
        previous_value=previous_value,
        new_value=new_value,
        reason=reason,
        approval_ref=approval_ref,
        evidence_ref=evidence_ref,
        related_events_json=related_events or [],
        is_simulated=is_simulated,
    )
    session.add(event)
    return event

