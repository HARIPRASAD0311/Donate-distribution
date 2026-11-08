from typing import Dict, List, Any
from sqlalchemy import String, Float, JSON, Boolean, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base
from backend.app.models.base import AuditMixin

class GeographicLocation(Base, AuditMixin):
    __tablename__ = "geographic_locations"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, index=True)
    code: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    region: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String, nullable=True)
    operational_status: Mapped[str] = mapped_column(String)
    capacity_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    related_facility_id: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    related_beneficiary_group_id: Mapped[str] = mapped_column(String, nullable=True)
    related_demand_ids_json: Mapped[List[str]] = mapped_column(JSON, nullable=True)
    radius_meters: Mapped[float] = mapped_column(Float, nullable=True)
    capacity: Mapped[str] = mapped_column(String, nullable=True)

class TransportRoute(Base, AuditMixin):
    __tablename__ = "transport_routes"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    origin_facility_id: Mapped[str] = mapped_column(String, index=True)
    destination_facility_id: Mapped[str] = mapped_column(String, index=True)
    distance_km: Mapped[float] = mapped_column(Float)
    transit_mode: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    waypoints_json: Mapped[List[List[float]]] = mapped_column(JSON) # [[lat, lng], ...]
    travel_time_hours: Mapped[float] = mapped_column(Float, nullable=True)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    blockage_reason: Mapped[str] = mapped_column(String, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('PASSABLE', 'PASSABLE_WATERWAY', 'DELAYED', 'BLOCKED')", name="chk_route_status"),
    )

class DisasterZone(Base, AuditMixin):
    __tablename__ = "disaster_zones"
    
    surrogate_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    disaster_type: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String)
    last_updated: Mapped[str] = mapped_column(String)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    data_classification: Mapped[str] = mapped_column(String, default="DEMO")
    description: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    geometry_json: Mapped[Dict[str, Any]] = mapped_column(JSON) # GeoJSON Polygon/MultiPolygon
