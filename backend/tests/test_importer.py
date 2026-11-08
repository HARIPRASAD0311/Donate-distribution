from datetime import datetime
from sqlalchemy import select, text, func
from backend.app.core.config import settings
from backend.app.core.database import engine, SessionLocal
from backend.app.models.incident import Incident
from backend.app.models.facility import Facility
from backend.app.models.geography import GeographicLocation, TransportRoute, DisasterZone
from backend.app.models.inventory import InventoryLot, InventoryTransaction
from backend.app.models.demand import BeneficiaryGroup, DemandRecord
from backend.app.models.dispatch import DispatchOrder
from backend.app.models.allocation import AllocationPlan, AllocationLine
from backend.app.models.recovery import RecoverySimulation, RecoveryStrategy
from backend.app.models.audit import AuditEvent

def test_sqlite_pragmas():
    """Verify PRAGMA foreign_keys=ON and WAL mode are active on every connection."""
    with engine.connect() as conn:
        fk = conn.execute(text("PRAGMA foreign_keys;")).scalar()
        wal = conn.execute(text("PRAGMA journal_mode;")).scalar()
        assert fk == 1, "foreign_keys PRAGMA must be 1 (ON)"
        assert wal.lower() == "wal", f"journal_mode must be WAL, got {wal}"

def test_scenario_clock():
    """Verify scenario clock is anchored at 2024-07-05T09:30:00Z."""
    assert settings.SCENARIO_NOW_STR == "2024-07-05T09:30:00Z"
    clock = settings.SCENARIO_NOW
    assert clock.year == 2024
    assert clock.month == 7
    assert clock.day == 5
    assert clock.hour == 9
    assert clock.minute == 30

def test_imported_row_counts():
    """Verify all tables were populated with expected row counts from synthetic fixtures."""
    session = SessionLocal()
    try:
        assert session.scalar(select(func.count()).select_from(Incident)) == 3
        assert session.scalar(select(func.count()).select_from(Facility)) == 3
        assert session.scalar(select(func.count()).select_from(GeographicLocation)) == 7
        assert session.scalar(select(func.count()).select_from(DisasterZone)) == 6
        assert session.scalar(select(func.count()).select_from(InventoryLot)) == 11
        assert session.scalar(select(func.count()).select_from(InventoryTransaction)) >= 26
        assert session.scalar(select(func.count()).select_from(BeneficiaryGroup)) == 6
        assert session.scalar(select(func.count()).select_from(DemandRecord)) == 11
        assert session.scalar(select(func.count()).select_from(DispatchOrder)) == 6
        assert session.scalar(select(func.count()).select_from(TransportRoute)) == 7
        assert session.scalar(select(func.count()).select_from(AllocationPlan)) == 3
        assert session.scalar(select(func.count()).select_from(AllocationLine)) == 6
        assert session.scalar(select(func.count()).select_from(RecoverySimulation)) == 1
        assert session.scalar(select(func.count()).select_from(RecoveryStrategy)) == 3
        assert session.scalar(select(func.count()).select_from(AuditEvent)) >= 10
    finally:
        session.close()

def test_tier_c_computed_by_tag():
    """Verify Tier C records carry computed_by == 'seed' and simulation watermarks."""
    session = SessionLocal()
    try:
        plans = session.scalars(select(AllocationPlan)).all()
        assert len(plans) == 3
        for p in plans:
            assert p.computed_by == "seed"
            assert p.is_simulated is True

        strategies = session.scalars(select(RecoveryStrategy)).all()
        assert len(strategies) == 3
        for s in strategies:
            assert s.computed_by == "seed"
            assert s.is_simulated is True

        sims = session.scalars(select(RecoverySimulation)).all()
        assert len(sims) == 1
        assert sims[0].computed_by == "seed"
    finally:
        session.close()

def test_json_column_deserialization():
    """Verify nested JSON data deserializes to native Python lists/dicts."""
    session = SessionLocal()
    try:
        zone = session.scalar(select(DisasterZone).limit(1))
        assert isinstance(zone.geometry_json, dict)
        assert zone.geometry_json.get("type") in ("Polygon", "MultiPolygon")
        assert "coordinates" in zone.geometry_json

        ben = session.scalar(select(BeneficiaryGroup).limit(1))
        assert isinstance(ben.vulnerabilities_json, dict)
        assert isinstance(ben.coordinates_json, list)
    finally:
        session.close()

def test_relative_time_normalization():
    """Verify relative times in dispatch orders are normalized to UTC ISO strings."""
    session = SessionLocal()
    try:
        orders = session.scalars(select(DispatchOrder)).all()
        assert len(orders) == 6
        for o in orders:
            assert "Today" not in o.expected_arrival
            assert "Tomorrow" not in o.expected_arrival
            # Should be valid ISO format
            assert o.expected_arrival.startswith("2024-07-")
    finally:
        session.close()

def test_duplicate_demand_id_ingested_safely():
    """Verify duplicate DEM-2024-061 records were both ingested via surrogate PK."""
    session = SessionLocal()
    try:
        demands = session.scalars(select(DemandRecord).where(DemandRecord.id == "DEM-2024-061")).all()
        assert len(demands) == 2, "Both rows with ID DEM-2024-061 must be stored safely"
        assert demands[0].surrogate_id != demands[1].surrogate_id
        # One is biscuits for GRP-01, other is water for GRP-05
        groups = {d.beneficiary_group_id for d in demands}
        assert "GRP-01" in groups
        assert "GRP-05" in groups
    finally:
        session.close()

def test_health_endpoint(client):
    """Verify health endpoint returns status and scenario reference clock."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["scenarioNow"] == "2024-07-05T09:30:00Z"
    assert data["mode"] == "live"
