from typing import Dict, List, Any
from sqlalchemy import String, Float, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class DispatchOrder(Base, AuditMixin):
    __tablename__ = "dispatch_orders"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. DSP-2026-001
    plan_id: Mapped[str] = mapped_column(String, index=True, nullable=True)
    allocation_id: Mapped[str] = mapped_column(String, index=True, nullable=True)
    source_facility_name: Mapped[str] = mapped_column(String)
    source_id: Mapped[str] = mapped_column(String, index=True)
    source_coords_json: Mapped[List[float]] = mapped_column(JSON) # [lat, lng]
    destination_name: Mapped[str] = mapped_column(String)
    destination_id: Mapped[str] = mapped_column(String, index=True) # e.g. BEN-01
    dest_coords_json: Mapped[List[float]] = mapped_column(JSON) # [lat, lng]
    current_coords_json: Mapped[List[float]] = mapped_column(JSON, nullable=True)
    commodity: Mapped[str] = mapped_column(String)
    item: Mapped[str] = mapped_column(String)
    batch_id: Mapped[str] = mapped_column(String, index=True)
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    vehicle: Mapped[str] = mapped_column(String)
    vehicle_type: Mapped[str] = mapped_column(String)
    carrier: Mapped[str] = mapped_column(String)
    driver: Mapped[str] = mapped_column(String)
    route_name: Mapped[str] = mapped_column(String)
    route_status: Mapped[str] = mapped_column(String)
    dispatched_at: Mapped[str] = mapped_column(String) # UTC ISO
    expected_arrival: Mapped[str] = mapped_column(String) # Normalized UTC ISO
    actual_arrival: Mapped[str] = mapped_column(String, nullable=True)
    delivered_at: Mapped[str] = mapped_column(String, nullable=True)
    verified_at: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="READY")
    progress_pct: Mapped[float] = mapped_column(Float, default=0.0)
    pod_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    exception_reason: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('PREPARING', 'READY', 'IN_TRANSIT', 'ARRIVED_AWAITING_POD', 'DELIVERED', 'VERIFIED', 'FAILED_DISRUPTED', 'CANCELLED')", name="chk_dispatch_status"),
    )

class DeliveryRecord(Base, AuditMixin):
    __tablename__ = "delivery_records"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. DEL-...
    dispatch_id: Mapped[str] = mapped_column(String, index=True)
    destination_facility_id: Mapped[str] = mapped_column(String, index=True)
    received_quantity: Mapped[float] = mapped_column(Float)
    accepted_quantity: Mapped[float] = mapped_column(Float)
    damaged_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    rejected_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    adjusted_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    adjustment_reason: Mapped[str] = mapped_column(String, nullable=True)
    verified_at: Mapped[str] = mapped_column(String) # UTC ISO
    verified_by: Mapped[str] = mapped_column(String)
    evidence_ref: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
