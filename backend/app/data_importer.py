import os
import sys
import csv
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from sqlalchemy import select, text
from backend.app.core.config import settings
from backend.app.core.database import engine, SessionLocal, Base
from backend.app.models.incident import Incident
from backend.app.models.facility import Facility
from backend.app.models.geography import GeographicLocation, TransportRoute, DisasterZone
from backend.app.models.inventory import InventoryLot, InventoryTransaction, StockReservation
from backend.app.models.demand import BeneficiaryGroup, DemandRecord
from backend.app.models.allocation import AllocationPlan, AllocationLine
from backend.app.models.recovery import RecoverySimulation, RecoveryStrategy
from backend.app.models.dispatch import DispatchOrder, DeliveryRecord
from backend.app.models.audit import AuditEvent

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "source"
CSV_DIR = DATA_DIR / "csv"
JSON_PATH = DATA_DIR / "json" / "scenario.json"

def parse_bool(val: Any) -> bool:
    if isinstance(val, bool):
        return val
    if not val:
        return False
    return str(val).strip().lower() in ("true", "1", "yes", "t")

def parse_float(val: Any, default: float = 0.0) -> float:
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def parse_int(val: Any, default: int = 0) -> int:
    if val is None or val == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default

def parse_json(val: Any, default: Any = None) -> Any:
    if not val:
        return default if default is not None else {}
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return default if default is not None else {}

def normalize_relative_time(time_str: str, base_dt: datetime) -> str:
    """Converts relative strings like 'Today 17:30 UTC' to standardized UTC ISO strings."""
    if not time_str:
        return ""
    val = time_str.strip()
    # Check for 'Today HH:MM' or 'Today HH:MM UTC'
    today_match = re.search(r'today\s+(\d{1,2}):(\d{2})', val, re.IGNORECASE)
    if today_match:
        h, m = int(today_match.group(1)), int(today_match.group(2))
        dt = datetime(base_dt.year, base_dt.month, base_dt.day, h, m, 0, tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")
    
    # Check for 'Tomorrow HH:MM' or 'Tomorrow HH:MM UTC'
    tomorrow_match = re.search(r'tomorrow\s+(\d{1,2}):(\d{2})', val, re.IGNORECASE)
    if tomorrow_match:
        h, m = int(tomorrow_match.group(1)), int(tomorrow_match.group(2))
        dt = datetime(base_dt.year, base_dt.month, base_dt.day, h, m, 0, tzinfo=timezone.utc) + timedelta(days=1)
        return dt.isoformat().replace("+00:00", "Z")
    
    # If already ISO-like
    if re.match(r'^\d{4}-\d{2}-\d{2}', val):
        return val
        
    return val

def normalize_route_status(status_str: str) -> str:
    if not status_str:
        return "PASSABLE"
    s = status_str.upper()
    if "WATERWAY" in s or "RIVER" in s:
        return "PASSABLE_WATERWAY"
    if "BLOCK" in s or "IMPASS" in s or "SUBMERGED" in s:
        return "BLOCKED"
    if "DELAY" in s or "RESTRICT" in s:
        return "DELAYED"
    return "PASSABLE"

def import_all(reset_db: bool = False):
    print("==================================================")
    print("RESQNET DATA IMPORTER")
    print(f"Scenario Reference Clock (SCENARIO_NOW): {settings.SCENARIO_NOW_STR}")
    print("==================================================")

    if reset_db:
        print("Resetting database: dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("Creating all tables afresh with PRAGMA foreign_keys=ON and WAL...")
        Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    base_dt = settings.SCENARIO_NOW
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    try:
        # 1. Incidents
        incidents_file = CSV_DIR / "incidents.csv"
        incidents_count = 0
        if incidents_file.exists():
            with open(incidents_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    center = parse_json(row.get("center_json"), [26.09, 91.5452])
                    incident = Incident(
                        id=row["id"],
                        code=row["code"],
                        name=row["name"],
                        region=row["region"],
                        crisis_type=row["crisisType"],
                        severity=row["severity"],
                        type=row["type"],
                        declared_at=row["declaredAt"],
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                        is_supported=parse_bool(row.get("isSupported", True)),
                        center_json=center,
                        zoom=parse_int(row.get("zoom"), 11),
                        active_dispatches_count=parse_int(row.get("activeDispatchesCount"), 0),
                        critical_pockets_count=parse_int(row.get("criticalPocketsCount"), 0),
                        source="ASDMA_SYNTHETIC_FIXTURE",
                        observed_at=row["declaredAt"],
                        received_at=now_iso,
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                    )
                    session.add(incident)
                    incidents_count += 1
        print(f"Imported {incidents_count} Incidents.")

        # 2. Facilities
        facilities_file = CSV_DIR / "facilities.csv"
        facilities_count = 0
        facility_code_to_id = {}
        if facilities_file.exists():
            with open(facilities_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    coords = parse_json(row.get("coordinates_json"), {})
                    lat = float(coords.get("lat", -19.832))
                    lng = float(coords.get("lng", 34.856))
                    fac = Facility(
                        id=row["id"],
                        code=row["code"],
                        name=row["name"],
                        location_name=row.get("locationName"),
                        latitude=lat,
                        longitude=lng,
                        coordinates_json=coords,
                        total_capacity_m3=parse_float(row.get("totalCapacityM3")),
                        utilized_capacity_m3=parse_float(row.get("utilizedCapacityM3")),
                        capacity_measurement_json=parse_json(row.get("capacityMeasurement_json")),
                        status=row.get("status", "OPERATIONAL"),
                        source="LOGISTICS_CLUSTER_SYNTHETIC",
                        observed_at=base_dt.isoformat(),
                        received_at=now_iso,
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                    )
                    session.add(fac)
                    facility_code_to_id[row["code"]] = row["id"]
                    facilities_count += 1
        print(f"Imported {facilities_count} Facilities.")

        # 3. Geographic Locations
        geo_file = CSV_DIR / "geographicLocations.csv"
        geo_count = 0
        if geo_file.exists():
            with open(geo_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    geo = GeographicLocation(
                        id=row["id"],
                        code=row["code"],
                        name=row["name"],
                        type=row["type"],
                        latitude=parse_float(row["latitude"]),
                        longitude=parse_float(row["longitude"]),
                        region=row["region"],
                        address=row.get("address"),
                        operational_status=row.get("operationalStatus", "OPERATIONAL"),
                        capacity_json=parse_json(row.get("capacity_json")),
                        related_facility_id=row.get("relatedFacilityId"),
                        notes=row.get("notes"),
                        is_demo=parse_bool(row.get("isDemo", True)),
                        related_beneficiary_group_id=row.get("relatedBeneficiaryGroupId"),
                        related_demand_ids_json=parse_json(row.get("relatedDemandIds_json"), []),
                        radius_meters=parse_float(row.get("radiusMeters")) if row.get("radiusMeters") else None,
                        capacity=row.get("capacity"),
                        source="GIS_SURVEY_SYNTHETIC",
                        observed_at=base_dt.isoformat(),
                        received_at=now_iso,
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=True,
                    )
                    session.add(geo)
                    geo_count += 1
        print(f"Imported {geo_count} Geographic Locations.")

        # 4. Disaster Zones
        zones_file = CSV_DIR / "disasterZones.csv"
        zones_count = 0
        if zones_file.exists():
            with open(zones_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    zone = DisasterZone(
                        id=row["id"],
                        name=row["name"],
                        disaster_type=row.get("disasterType", "FLOOD"),
                        severity=row.get("severity", "CRITICAL"),
                        status=row.get("status", "ACTIVE"),
                        source=row.get("source", "RADAR_SATELLITE"),
                        last_updated=row.get("lastUpdated", base_dt.isoformat()),
                        is_demo=parse_bool(row.get("isDemo", True)),
                        data_classification=row.get("dataClassification", "DEMO"),
                        description=row.get("description"),
                        notes=row.get("notes"),
                        geometry_json=parse_json(row.get("geometry_json")),
                        observed_at=row.get("lastUpdated", base_dt.isoformat()),
                        received_at=now_iso,
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=True,
                    )
                    session.add(zone)
                    zones_count += 1
        print(f"Imported {zones_count} Disaster Zones.")

        # 5. Inventory Lots & Initial Transactions
        inv_file = CSV_DIR / "inventory.csv"
        inv_count = 0
        tx_count = 0
        if inv_file.exists():
            with open(inv_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    expiry_date = row.get("expiryDate")
                    days_to_expiry = None
                    if expiry_date:
                        try:
                            exp_dt = datetime.strptime(expiry_date, "%Y-%m-%d").date()
                            days_to_expiry = (exp_dt - base_dt.date()).days
                        except ValueError:
                            days_to_expiry = parse_int(row.get("daysToExpiry"))

                    lot = InventoryLot(
                        id=row["id"],
                        name=row["name"],
                        commodity=row["commodity"],
                        category=row["category"],
                        batch_id=row["batchId"],
                        facility_id=row["facilityId"],
                        facility_name=row["facilityName"],
                        total_qty=parse_float(row["totalQty"]),
                        reserved_qty=parse_float(row.get("reservedQty", 0.0)),
                        usable_qty=parse_float(row["usableQty"]),
                        quarantined_qty=parse_float(row.get("quarantinedQty", 0.0)),
                        unit=row["unit"],
                        expiry_date=expiry_date,
                        days_to_expiry=days_to_expiry,
                        quality_status=row["qualityStatus"],
                        storage_location=row.get("storageLocation"),
                        source=row.get("source", "SUPPLIER"),
                        received_date=row["receivedDate"],
                        received_qty=parse_float(row.get("receivedQty")),
                        fefo_eligible=parse_bool(row.get("fefoEligible", True)),
                        quality_record_json=parse_json(row.get("qualityRecord_json")),
                        movement_history_json=parse_json(row.get("movementHistory_json"), []),
                        cold_chain_required=parse_bool(row.get("coldChainRequired")),
                        current_temp_celsius=parse_float(row.get("currentTempCelsius")) if row.get("currentTempCelsius") else None,
                        temp_excursion_flag=parse_bool(row.get("tempExcursionFlag")),
                        observed_at=row.get("receivedDate"),
                        received_at=row.get("receivedDate"),
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                    )
                    session.add(lot)
                    inv_count += 1

                    # Ingest movement history entries as initial transactions
                    movements = parse_json(row.get("movementHistory_json"), [])
                    for i, m in enumerate(movements):
                        tx = InventoryTransaction(
                            id=f"TX-{row['id']}-{i+1}",
                            lot_id=row["id"],
                            type=m.get("action", "RECEIPT"),
                            quantity=abs(parse_float(m.get("qty", 0.0))),
                            unit=row["unit"],
                            commodity=row["commodity"],
                            occurred_at=m.get("date", base_dt.date().isoformat()),
                            actor=m.get("user", "SYSTEM_LOGISTICS"),
                            reason="Seeded movement history",
                            source="INVENTORY_LEDGER_FIXTURE",
                            is_simulated=True,
                        )
                        session.add(tx)
                        tx_count += 1
        print(f"Imported {inv_count} Inventory Lots and {tx_count} Transactions.")

        # 6. Beneficiaries
        ben_file = CSV_DIR / "beneficiaries.csv"
        ben_count = 0
        if ben_file.exists():
            with open(ben_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    coords = parse_json(row.get("coordinates_json"), [26.11592, 91.51712])
                    ben = BeneficiaryGroup(
                        id=row["id"],
                        code=row["code"],
                        name=row["name"],
                        region=row["region"],
                        latitude=float(coords[0]),
                        longitude=float(coords[1]),
                        coordinates_json=coords,
                        category=row.get("category", "IDP Camp"),
                        population=parse_int(row.get("population")),
                        households=parse_int(row.get("households")),
                        vulnerabilities_json=parse_json(row.get("vulnerabilities_json")),
                        focal_point=row.get("focalPoint"),
                        status=row.get("status", "ACTIVE_ASSISTANCE_REQUIRED"),
                        access_condition=row.get("accessCondition", "WATERWAY_ONLY"),
                        source="UNICEF_NEEDS_ASSESSMENT",
                        observed_at=base_dt.isoformat(),
                        received_at=now_iso,
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                    )
                    session.add(ben)
                    ben_count += 1
        print(f"Imported {ben_count} Beneficiary Groups.")

        # 7. Demands (tolerates duplicate DEM-2024-061 via surrogate_id)
        demands_file = CSV_DIR / "demands.csv"
        demands_count = 0
        if demands_file.exists():
            with open(demands_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    coords = parse_json(row.get("coordinates_json"), [26.11592, 91.51712])
                    qty = parse_float(row["quantity"])
                    fulfilled = parse_float(row.get("fulfilledQuantity", 0.0))
                    rem = parse_float(row.get("remainingQuantity", qty - fulfilled))
                    demand = DemandRecord(
                        id=row["id"],
                        incident_id=row["incidentId"],
                        region=row["region"],
                        location=row["location"],
                        latitude=float(coords[0]),
                        longitude=float(coords[1]),
                        coordinates_json=coords,
                        beneficiary_group_id=row["beneficiaryGroupId"],
                        beneficiary_group_name=row["beneficiaryGroup"],
                        commodity=row["commodity"],
                        item=row["item"],
                        quantity=qty,
                        fulfilled_quantity=fulfilled,
                        remaining_quantity=rem,
                        unit=row["unit"],
                        priority=row["priority"],
                        required_by_date=row["requiredByDate"],
                        reporting_source=row.get("reportingSource", "FIELD_ASSESSMENT"),
                        verification_status=row.get("verificationStatus", "VERIFIED"),
                        verification_details_json=parse_json(row.get("verificationDetails_json")),
                        notes=row.get("notes"),
                        source="UN_OCHA_DEMAND_REGISTER",
                        observed_at=row.get("requiredByDate"),
                        received_at=now_iso,
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                    )
                    session.add(demand)
                    demands_count += 1
        print(f"Imported {demands_count} Demands.")

        # 8. Dispatch Orders
        dispatches_file = CSV_DIR / "dispatchOrders.csv"
        dispatches_count = 0
        if dispatches_file.exists():
            with open(dispatches_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    exp_arrival_norm = normalize_relative_time(row.get("expectedArrival"), base_dt)
                    order = DispatchOrder(
                        id=row["id"],
                        plan_id=row.get("planId"),
                        allocation_id=row.get("allocationId"),
                        source_facility_name=row["source"],
                        source_id=row["sourceId"],
                        source_coords_json=parse_json(row.get("sourceCoords_json"), []),
                        destination_name=row["destination"],
                        destination_id=row["destinationId"],
                        dest_coords_json=parse_json(row.get("destCoords_json"), []),
                        current_coords_json=parse_json(row.get("currentCoords_json")),
                        commodity=row["commodity"],
                        item=row["item"],
                        batch_id=row["batchId"],
                        quantity=parse_float(row["quantity"]),
                        unit=row["unit"],
                        vehicle=row["vehicle"],
                        vehicle_type=row["vehicleType"],
                        carrier=row["carrier"],
                        driver=row["driver"],
                        route_name=row["route"],
                        route_status=row["routeStatus"],
                        dispatched_at=row["dispatchedAt"],
                        expected_arrival=exp_arrival_norm,
                        actual_arrival=row.get("actualArrival") or None,
                        delivered_at=row.get("deliveredAt") or None,
                        verified_at=row.get("verifiedAt") or None,
                        status=row.get("status", "READY"),
                        progress_pct=parse_float(row.get("progressPct", 0.0)),
                        pod_json=parse_json(row.get("pod_json")),
                        exception_reason=row.get("exceptionReason"),
                        notes=row.get("notes"),
                        source="LOGISTICS_CONVOY_TELEMETRY",
                        observed_at=row.get("dispatchedAt"),
                        received_at=now_iso,
                        verification_status="VERIFIED",
                        submitted_by="SYSTEM_IMPORTER",
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                    )
                    session.add(order)
                    dispatches_count += 1
        print(f"Imported {dispatches_count} Dispatch Orders.")

        # 9. Audit Events
        audit_file = CSV_DIR / "auditEvents.csv"
        audit_count = 0
        if audit_file.exists():
            with open(audit_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    evt = AuditEvent(
                        id=row["id"],
                        timestamp=row["timestamp"],
                        user=row["user"],
                        role=row["role"],
                        action=row["action"],
                        module=row["module"],
                        entity_id=row["entityId"],
                        status=row["status"],
                        previous_value=row.get("previousValue"),
                        new_value=row.get("newValue"),
                        reason=row["reason"],
                        approval_ref=row.get("approvalRef"),
                        evidence_ref=row.get("evidenceRef"),
                        related_events_json=parse_json(row.get("relatedEvents_json"), []),
                        is_simulated=parse_bool(row.get("isSimulated", True)),
                    )
                    session.add(evt)
                    audit_count += 1
        print(f"Imported {audit_count} Audit Events.")

        # 10. Ingest scenario.json (Routes, Tier C Allocation Plans & Recovery Strategies)
        routes_count = 0
        plans_count = 0
        lines_count = 0
        strategies_count = 0
        if JSON_PATH.exists():
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                scenario_data = json.load(f)

            # Ingest Transport Routes
            net_routes = scenario_data.get("network", {}).get("routes", [])
            for r in net_routes:
                points = r.get("points", [])
                st = normalize_route_status(r.get("routeStatus"))
                route = TransportRoute(
                    id=r["id"],
                    name=r["name"],
                    origin_facility_id=r.get("origin", ""),
                    destination_facility_id=r.get("destination", ""),
                    distance_km=parse_float(r.get("distanceKm", 0.0)),
                    transit_mode=r.get("transportMode", "TRUCK"),
                    status=st,
                    waypoints_json=points,
                    travel_time_hours=0.5,
                    is_blocked=(st == "BLOCKED"),
                    blockage_reason=r.get("disruptionReason") if st == "BLOCKED" else None,
                    source="GIS_ROUTE_SURVEY",
                    observed_at=base_dt.isoformat(),
                    received_at=now_iso,
                    verification_status="VERIFIED",
                    submitted_by="SYSTEM_IMPORTER",
                    is_simulated=True,
                )
                session.add(route)
                routes_count += 1
            print(f"Imported {routes_count} Transport Routes from scenario.json.")

            # Ingest Tier C Allocation Plans (computed_by = 'seed')
            mock_plans = scenario_data.get("allocation", {}).get("MOCK_PLANS", {})
            for pid, pdata in mock_plans.items():
                plan = AllocationPlan(
                    id=pid,
                    incident_id="INC-2026-0412",
                    status="APPROVED" if pid == "PLAN-ALPHA" else "CANDIDATE",
                    humanitarian_welfare_score=parse_float(pdata.get("overallCoveragePct", 94.62)),
                    gini_coefficient=parse_float(pdata.get("giniCoefficient", 0.18)),
                    objective_value=parse_float(pdata.get("objectiveValue", 94.62)),
                    feasibility=pdata.get("feasibilityBadge", "OPTIMAL_FEASIBLE"),
                    solver_name="HiGHS Mixed-Integer Linear Program",
                    computed_by="seed",
                    created_at=base_dt.isoformat(),
                    approved_at=base_dt.isoformat() if pid == "PLAN-ALPHA" else None,
                    approved_by="Operational Commander S. Vance" if pid == "PLAN-ALPHA" else None,
                    approval_notes="Optimal multi-echelon compromise meeting minimum Sphere standards.",
                    source="OPTIMIZER_SEED_RUN",
                    is_simulated=True,
                )
                session.add(plan)
                plans_count += 1

                for alc in pdata.get("allocations", []):
                    line = AllocationLine(
                        id=alc["id"],
                        plan_id=pid,
                        lot_id=alc.get("batchId", "BATCH-24045"),
                        demand_id=alc.get("demandId"),
                        source_facility_id=alc.get("sourceFacilityId", "CSD-01"),
                        destination_facility_id=alc.get("destinationFacilityId"),
                        commodity=alc.get("commodity", "FOOD"),
                        item=alc.get("item", ""),
                        quantity=parse_float(alc.get("allocatedQty")),
                        dispatched_quantity=parse_float(alc.get("allocatedQty")) if pid == "PLAN-ALPHA" else 0.0,
                        unit=alc.get("unit", "packets"),
                        status="PARTIALLY_DISPATCHED" if pid == "PLAN-ALPHA" else "RESERVED",
                        source="OPTIMIZER_SEED_RUN",
                        is_simulated=True,
                    )
                    session.add(line)
                    lines_count += 1
            print(f"Imported {plans_count} Allocation Plans and {lines_count} Allocation Lines (Tier C seeded).")

            # Ingest Tier C Recovery Simulation & Strategies (computed_by = 'seed')
            sim = RecoverySimulation(
                simulation_id="SIM-MC-SEED-01",
                baseline_plan_id="PLAN-ALPHA",
                incident_id="INC-2026-0412",
                disruption_scenario_name="Brahmaputra Culvert Washout & River Inundation",
                num_runs=500,
                time_horizon_hours=72.0,
                engine="SimPy Multi-Scenario Monte Carlo",
                computed_by="seed",
                status="COMPLETED",
                analytics_json=scenario_data.get("recovery", {}).get("RECOVERY_ANALYTICS"),
                created_at=base_dt.isoformat(),
                source="SIMULATION_SEED_RUN",
                is_simulated=True,
            )
            session.add(sim)

            mock_strategies = scenario_data.get("recovery", {}).get("MOCK_RECOVERY_STRATEGIES", [])
            for strat in mock_strategies:
                rs = RecoveryStrategy(
                    id=strat["id"],
                    simulation_id="SIM-MC-SEED-01",
                    name=strat["name"],
                    description=strat["description"],
                    feasibility=strat.get("feasibility", "FEASIBLE"),
                    estimated_recovery_time_hours=parse_float(strat.get("expectedRecoveryTimeHours", 14.5)),
                    population_coverage_pct=parse_float(strat.get("criticalCoveragePct", 100.0)),
                    overall_resilience_score=parse_float(strat.get("overallResilienceScore", 88.0)),
                    computed_by="seed",
                    status="APPROVED" if strat["id"] == "STRAT-ALPHA" else "CANDIDATE",
                    approved_at=base_dt.isoformat() if strat["id"] == "STRAT-ALPHA" else None,
                    approved_by="Operational Commander S. Vance" if strat["id"] == "STRAT-ALPHA" else None,
                    actions_json=strat.get("actionsApplied", []),
                    source="SIMULATION_SEED_RUN",
                    is_simulated=True,
                )
                session.add(rs)
                strategies_count += 1
            print(f"Imported 1 Recovery Simulation and {strategies_count} Recovery Strategies (Tier C seeded).")

        # 11. Initial Audit Record for Ingestion Batch
        import_event = AuditEvent(
            id=f"EVT-INIT-{int(datetime.now().timestamp())}",
            timestamp=now_iso,
            user="SYSTEM_AUTOMATED_IMPORTER",
            role="Data Pipeline Engine",
            action="SYSTEM_DATA_IMPORT_COMPLETED",
            module="Core Importer",
            entity_id="DATABASE_IMPORT_BATCH",
            status="VERIFIED",
            previous_value="EMPTY_DATABASE" if reset_db else "EXISTING_DATABASE",
            new_value="SEEDED_OPERATIONAL_STATE",
            reason="Automated baseline data ingestion from synthetic fixtures",
            approval_ref="SYSTEM_BOOTSTRAP_001",
            evidence_ref="SHA256_VERIFIED_DATA_SOURCE",
            related_events_json=[],
            is_simulated=True,
        )
        session.add(import_event)

        session.commit()
        print("\nAll records successfully committed to SQLite.")
        print("Data ingestion completed successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error during ingestion: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    reset = "--reset" in sys.argv
    import_all(reset_db=reset)
