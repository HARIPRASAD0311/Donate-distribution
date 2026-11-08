from typing import Dict, Any
from sqlalchemy import String, Float, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class AllocationPlan(Base, AuditMixin):
    __tablename__ = "allocation_plans"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. PLAN-ALPHA
    incident_id: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[str] = mapped_column(String, default="CANDIDATE")
    humanitarian_welfare_score: Mapped[float] = mapped_column(Float, default=0.0)
    gini_coefficient: Mapped[float] = mapped_column(Float, default=0.0)
    objective_value: Mapped[float] = mapped_column(Float, default=0.0)
    feasibility: Mapped[str] = mapped_column(String, default="OPTIMAL_FEASIBLE")
    solver_name: Mapped[str] = mapped_column(String, default="HiGHS")
    computed_by: Mapped[str] = mapped_column(String, default="seed") # 'seed' or 'engine'
    approved_at: Mapped[str] = mapped_column(String, nullable=True)
    approved_by: Mapped[str] = mapped_column(String, nullable=True)
    approval_notes: Mapped[str] = mapped_column(String, nullable=True)
    constraint_diagnostics_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[str] = mapped_column(String)

    __table_args__ = (
        CheckConstraint("status IN ('CANDIDATE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED')", name="chk_plan_status"),
        CheckConstraint("computed_by IN ('seed', 'engine')", name="chk_plan_computed_by"),
    )

class AllocationLine(Base, AuditMixin):
    __tablename__ = "allocation_lines"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. ALN-...
    plan_id: Mapped[str] = mapped_column(String, index=True)
    lot_id: Mapped[str] = mapped_column(String, index=True)
    demand_id: Mapped[str] = mapped_column(String, index=True, nullable=True)
    source_facility_id: Mapped[str] = mapped_column(String, index=True)
    destination_facility_id: Mapped[str] = mapped_column(String, index=True, nullable=True)
    commodity: Mapped[str] = mapped_column(String)
    item: Mapped[str] = mapped_column(String)
    quantity: Mapped[float] = mapped_column(Float)
    dispatched_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="RESERVED")

    __table_args__ = (
        CheckConstraint("status IN ('RESERVED', 'PARTIALLY_DISPATCHED', 'CONSUMED', 'RELEASED')", name="chk_line_status"),
    )
