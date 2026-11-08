import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.inventory import InventoryLot
from backend.app.models.demand import DemandRecord

client = TestClient(app)

def test_get_command_center_by_incident():
    """Verify GET /api/v1/incidents/{id}/command-center returns all dynamic components."""
    response = client.get("/api/v1/incidents/INC-2026-0412/command-center")
    assert response.status_code == 200
    data = response.json()

    assert data["isSupported"] is True
    assert "Assam" in data["regionName"] or "Flood" in data["scopeLabel"]
    
    # 6 Core Aggregate KPIs
    assert len(data["kpis"]) == 6
    kpi_ids = {k["id"] for k in data["kpis"]}
    assert "kpi-affected-pop" in kpi_ids
    assert "kpi-usable-resources" in kpi_ids
    assert "kpi-unmet-demand" in kpi_ids
    assert "kpi-affected-locations" in kpi_ids
    assert "kpi-inaccessible-locations" in kpi_ids
    assert "kpi-active-disruptions" in kpi_ids

    # 5 Enterprise KPI Sections (A to E)
    assert len(data["sections"]) == 5
    section_codes = [s["code"] for s in data["sections"]]
    assert section_codes == ["A", "B", "C", "D", "E"]

    # 5 Analytics Charts
    charts = data["charts"]
    assert "commodityAvailability" in charts
    assert len(charts["commodityAvailability"]) >= 5
    assert "regionalCoverage" in charts
    assert len(charts["regionalCoverage"]) > 0
    assert "criticalDemandDonut" in charts
    assert len(charts["criticalDemandDonut"]) > 0
    assert "activityTimeline" in charts
    assert len(charts["activityTimeline"]) == 7
    assert "facilityReadiness" in charts
    assert len(charts["facilityReadiness"]) == 3

    # Map Entities
    map_entities = data["mapEntities"]
    assert "center" in map_entities
    assert len(map_entities["facilities"]) == 3
    fac0 = map_entities["facilities"][0]
    assert "totalCapacityM3" in fac0
    assert "utilizedCapacityM3" in fac0
    assert "utilizationPct" in fac0
    assert "locationName" in fac0
    assert len(map_entities["communities"]) > 0
    comm0 = map_entities["communities"][0]
    assert "primaryNeed" in comm0
    assert "accessMethod" in comm0
    assert "unmetQty" in comm0
    assert len(map_entities["routes"]) > 0
    assert "dashArray" in map_entities["routes"][0]
    assert len(map_entities["disruptions"]) > 0
    assert "suggestedBypass" in map_entities["disruptions"][0]

    # Operational Panels
    panels = data["operationalPanels"]
    assert len(panels["criticalIncidents"]) > 0
    assert len(panels["activeDisruptions"]) > 0
    assert len(panels["facilityStatus"]) == 3
    assert len(panels["pendingDecisions"]) > 0
    assert len(panels["recentEvents"]) > 0

    # Priority Demands
    assert len(data["priorityDemands"]) > 0
    first_demand = data["priorityDemands"][0]
    assert first_demand["priority"] in ("CRITICAL", "HIGH")
    assert first_demand["unmetQty"] > 0

def test_get_command_center_query_param():
    """Verify GET /api/v1/command-center?incidentId=... returns identical structure."""
    response = client.get("/api/v1/command-center?incidentId=INC-2026-0412")
    assert response.status_code == 200
    data = response.json()
    assert data["isSupported"] is True
    assert len(data["kpis"]) == 6
    assert len(data["sections"]) == 5

def test_dynamic_responsiveness_on_inventory_receive():
    """
    CRITICAL ZERO-HARDCODED CHECK:
    Adding inventory dynamically changes the derived available inventory KPI and charts.
    """
    # 1. Fetch baseline command center
    res1 = client.get("/api/v1/incidents/INC-2026-0412/command-center")
    assert res1.status_code == 200
    data1 = res1.json()

    # Find food KPI in Section A
    sec_a1 = next(s for s in data1["sections"] if s["code"] == "A")
    food_card1 = next(c for c in sec_a1["cards"] if c["id"] == "kpi-inv-food")
    initial_food_val = int(food_card1["value"].replace(",", ""))

    # 2. Receive 500 packets of food
    test_lot_id = "LOT-TEST-DYN-01"
    receive_payload = {
        "id": test_lot_id,
        "name": "Emergency Ration Packs",
        "commodity": "FOOD",
        "category": "RATIONS",
        "facilityId": "FAC-01",
        "facilityName": "Central Staging Depot",
        "quantity": 500.0,
        "unit": "packets",
        "qualityStatus": "VERIFIED_USABLE",
        "fefoEligible": True,
        "source": "UNICEF Emergency Airlift",
        "batchId": "BATCH-TEST-DYN",
        "receivedDate": "2024-07-05",
        "submittedBy": "Test Logistics Officer"
    }
    try:
        recv_res = client.post("/api/v1/inventory/receive", json=receive_payload)
        assert recv_res.status_code == 201

        # 3. Fetch command center again
        res2 = client.get("/api/v1/incidents/INC-2026-0412/command-center")
        assert res2.status_code == 200
        data2 = res2.json()

        sec_a2 = next(s for s in data2["sections"] if s["code"] == "A")
        food_card2 = next(c for c in sec_a2["cards"] if c["id"] == "kpi-inv-food")
        updated_food_val = int(food_card2["value"].replace(",", ""))

        # The KPI must reflect the new 500 units dynamically!
        assert updated_food_val == initial_food_val + 500
    finally:
        # Clean up test lot to preserve DB state
        with SessionLocal() as db:
            lot = db.query(InventoryLot).filter(InventoryLot.id == test_lot_id).first()
            if lot:
                db.delete(lot)
                db.commit()

def test_not_found_incident_command_center():
    """Verify 404 is returned for completely nonexistent incident id."""
    response = client.get("/api/v1/incidents/NONEXISTENT-INCIDENT-999/command-center")
    assert response.status_code == 404
