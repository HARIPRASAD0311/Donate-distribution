from typing import Dict, List, Any
from sqlalchemy import String, Float, Integer, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class RecoverySimulation(Base, AuditMixin):
    __tablename__ = "recovery_simulations"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    simulation_id: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. SIM-MC-...
    baseline_plan_id: Mapped[str] = mapped_column(String, index=True)
    incident_id: Mapped[str] = mapped_column(String, index=True)
    disruption_scenario_name: Mapped[str] = mapped_column(String)
    num_runs: Mapped[int] = mapped_column(Integer, default=500)
    time_horizon_hours: Mapped[float] = mapped_column(Float, default=72.0)
    engine: Mapped[str] = mapped_column(String, default="SimPy")
    computed_by: Mapped[str] = mapped_column(String, default="seed") # 'seed' or 'engine'
    status: Mapped[str] = mapped_column(String, default="COMPLETED")
    analytics_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[str] = mapped_column(String)

    __table_args__ = (
        CheckConstraint("computed_by IN ('seed', 'engine')", name="chk_sim_computed_by"),
    )

class RecoveryStrategy(Base, AuditMixin):
    __tablename__ = "recovery_strategies"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. STRAT-ALPHA
    simulation_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    feasibility: Mapped[str] = mapped_column(String, default="FEASIBLE")
    estimated_recovery_time_hours: Mapped[float] = mapped_column(Float)
    population_coverage_pct: Mapped[float] = mapped_column(Float)
    overall_resilience_score: Mapped[float] = mapped_column(Float)
    computed_by: Mapped[str] = mapped_column(String, default="seed") # 'seed' or 'engine'
    status: Mapped[str] = mapped_column(String, default="CANDIDATE")
    approved_at: Mapped[str] = mapped_column(String, nullable=True)
    approved_by: Mapped[str] = mapped_column(String, nullable=True)
    actions_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)

    __table_args__ = (
        CheckConstraint("status IN ('CANDIDATE', 'APPROVED', 'REJECTED')", name="chk_strategy_status"),
        CheckConstraint("computed_by IN ('seed', 'engine')", name="chk_strategy_computed_by"),
    )

