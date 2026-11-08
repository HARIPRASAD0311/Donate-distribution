from typing import List, Any
from sqlalchemy import String, Integer, Boolean, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class Incident(Base, AuditMixin):
    __tablename__ = "incidents"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True)
    code: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    region: Mapped[str] = mapped_column(String)
    crisis_type: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    declared_at: Mapped[str] = mapped_column(String)
    is_supported: Mapped[bool] = mapped_column(Boolean, default=True)
    center_json: Mapped[List[float]] = mapped_column(JSON)
    zoom: Mapped[int] = mapped_column(Integer, default=11)
    active_dispatches_count: Mapped[int] = mapped_column(Integer, default=0)
    critical_pockets_count: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        CheckConstraint("crisis_type IN ('Flood', 'Armed Conflict', 'Conflict', 'Pandemic')", name="chk_incident_crisis_type"),
    )
