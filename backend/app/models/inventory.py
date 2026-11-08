from typing import Dict, List, Any
from sqlalchemy import String, Float, Integer, Boolean, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class InventoryLot(Base, AuditMixin):
    __tablename__ = "inventory_lots"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    commodity: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[str] = mapped_column(String)
    batch_id: Mapped[str] = mapped_column(String, index=True)
    facility_id: Mapped[str] = mapped_column(String, index=True)
    facility_name: Mapped[str] = mapped_column(String)
    total_qty: Mapped[float] = mapped_column(Float)
    reserved_qty: Mapped[float] = mapped_column(Float, default=0.0)
    usable_qty: Mapped[float] = mapped_column(Float)
    quarantined_qty: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String)
    expiry_date: Mapped[str] = mapped_column(String, nullable=True) # YYYY-MM-DD
    days_to_expiry: Mapped[int] = mapped_column(Integer, nullable=True)
    quality_status: Mapped[str] = mapped_column(String)
    storage_location: Mapped[str] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String)
    received_date: Mapped[str] = mapped_column(String) # YYYY-MM-DD
    received_qty: Mapped[float] = mapped_column(Float, nullable=True)
    fefo_eligible: Mapped[bool] = mapped_column(Boolean, default=True)
    quality_record_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    movement_history_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    cold_chain_required: Mapped[bool] = mapped_column(Boolean, default=False)
    current_temp_celsius: Mapped[float] = mapped_column(Float, nullable=True)
    temp_excursion_flag: Mapped[bool] = mapped_column(Boolean, default=False)

    __table_args__ = (
        CheckConstraint("quality_status IN ('VERIFIED_USABLE', 'AWAITING_QC', 'PENDING_QC', 'QUARANTINED', 'EXPIRED')", name="chk_lot_quality_status"),
        CheckConstraint("commodity IN ('FOOD', 'WATER', 'MEDICAL', 'SHELTER')", name="chk_lot_commodity"),
    )

class InventoryTransaction(Base, AuditMixin):
    __tablename__ = "inventory_transactions"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True)
    lot_id: Mapped[str] = mapped_column(String, index=True)
    type: Mapped[str] = mapped_column(String) # RECEIPT, DISPATCH, QUARANTINE, DAMAGE, DESTINATION_ACCEPT, DESTINATION_REJECT, DOCUMENTED_ADJUSTMENT
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    commodity: Mapped[str] = mapped_column(String)
    occurred_at: Mapped[str] = mapped_column(String)
    related_dispatch_id: Mapped[str] = mapped_column(String, nullable=True)
    related_plan_id: Mapped[str] = mapped_column(String, nullable=True)
    actor: Mapped[str] = mapped_column(String)
    reason: Mapped[str] = mapped_column(String, nullable=True)

class StockReservation(Base, AuditMixin):
    __tablename__ = "stock_reservations"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True)
    line_id: Mapped[str] = mapped_column(String, index=True)
    plan_id: Mapped[str] = mapped_column(String, index=True)
    lot_id: Mapped[str] = mapped_column(String, index=True)
    demand_id: Mapped[str] = mapped_column(String, index=True, nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="ACTIVE") # ACTIVE, RELEASED, CONSUMED
    created_at: Mapped[str] = mapped_column(String)

    __table_args__ = (
        CheckConstraint("status IN ('ACTIVE', 'RELEASED', 'CONSUMED')", name="chk_reservation_status"),
    )
