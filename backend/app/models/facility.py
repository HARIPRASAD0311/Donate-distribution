from typing import Dict, Any
from sqlalchemy import String, Float, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class Facility(Base, AuditMixin):
    __tablename__ = "facilities"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    location_name: Mapped[str] = mapped_column(String, nullable=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    coordinates_json: Mapped[Dict[str, Any]] = mapped_column(JSON)
    total_capacity_m3: Mapped[float] = mapped_column(Float)
    utilized_capacity_m3: Mapped[float] = mapped_column(Float)
    capacity_measurement_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String)

    __table_args__ = (
        CheckConstraint("status IN ('OPERATIONAL', 'CONSTRAINED', 'INACTIVE')", name="chk_facility_status"),
    )
