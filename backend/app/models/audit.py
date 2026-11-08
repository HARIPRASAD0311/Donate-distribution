from typing import List
from sqlalchemy import String, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, index=True) # e.g. EVT-2024-0625
    timestamp: Mapped[str] = mapped_column(String) # UTC ISO
    user: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String, index=True)
    module: Mapped[str] = mapped_column(String, index=True)
    entity_id: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[str] = mapped_column(String)
    previous_value: Mapped[str] = mapped_column(String, nullable=True)
    new_value: Mapped[str] = mapped_column(String, nullable=True)
    reason: Mapped[str] = mapped_column(String)
    approval_ref: Mapped[str] = mapped_column(String, nullable=True)
    evidence_ref: Mapped[str] = mapped_column(String, nullable=True)
    related_events_json: Mapped[List[str]] = mapped_column(JSON, default=list)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)

