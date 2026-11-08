from typing import Dict, List, Any
from sqlalchemy import String, Float, Integer, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class BeneficiaryGroup(Base, AuditMixin):
    __tablename__ = "beneficiary_groups"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, index=True) # e.g. GRP-01
    code: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. CAMP-DELTA
    name: Mapped[str] = mapped_column(String)
    region: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    coordinates_json: Mapped[List[float]] = mapped_column(JSON) # [lat, lng]
    category: Mapped[str] = mapped_column(String)
    population: Mapped[int] = mapped_column(Integer)
    households: Mapped[int] = mapped_column(Integer)
    vulnerabilities_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    focal_point: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String)
    access_condition: Mapped[str] = mapped_column(String)

class DemandRecord(Base, AuditMixin):
    __tablename__ = "demands"
    
    # Surrogate ID handles duplicate source IDs safely (e.g. DEM-2024-061 collision)
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, index=True)
    incident_id: Mapped[str] = mapped_column(String, index=True)
    region: Mapped[str] = mapped_column(String)
    location: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    coordinates_json: Mapped[List[float]] = mapped_column(JSON) # [lat, lng]
    beneficiary_group_id: Mapped[str] = mapped_column(String, index=True)
    beneficiary_group_name: Mapped[str] = mapped_column(String)
    commodity: Mapped[str] = mapped_column(String, index=True)
    item: Mapped[str] = mapped_column(String)
    quantity: Mapped[float] = mapped_column(Float)
    fulfilled_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    remaining_quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    priority: Mapped[str] = mapped_column(String)
    required_by_date: Mapped[str] = mapped_column(String) # YYYY-MM-DD
    reporting_source: Mapped[str] = mapped_column(String)
    verification_status: Mapped[str] = mapped_column(String, default="PENDING")
    verification_details_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)

    __table_args__ = (
        CheckConstraint("priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW')", name="chk_demand_priority"),
        CheckConstraint("verification_status IN ('VERIFIED', 'PENDING', 'REJECTED', 'DISPUTED')", name="chk_demand_verification_status"),
        CheckConstraint("commodity IN ('FOOD', 'WATER', 'MEDICAL', 'SHELTER')", name="chk_demand_commodity"),
    )
