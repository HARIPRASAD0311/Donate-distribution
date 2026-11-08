import pytest
from sqlalchemy import select, delete
from backend.app.core.database import SessionLocal
from backend.app.models.inventory import InventoryLot, InventoryTransaction
from backend.app.models.dispatch import DispatchOrder, DeliveryRecord

def test_list_incidents(client):
    res = client.get("/api/v1/incidents")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    # Check camelCase fields
    assert "crisisType" in data[0]
    assert "declaredAt" in data[0]
    assert "centerJson" in data[0]

def test_list_facilities(client):
    res = client.get("/api/v1/facilities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    assert "totalCapacityM3" in data[0]
    assert "utilizedCapacityM3" in data[0]

def test_get_geography(client):
    # Locations
    res_loc = client.get("/api/v1/geography/locations")
    assert res_loc.status_code == 200
    assert len(res_loc.json()) >= 7

    # Routes
    res_rt = client.get("/api/v1/geography/routes")
    assert res_rt.status_code == 200
    data_rt = res_rt.json()
    assert len(data_rt) >= 7
    assert "waypointsJson" in data_rt[0]
    assert "distanceKm" in data_rt[0]

    # Disaster zones
    res_dz = client.get("/api/v1/geography/disaster-zones")
    assert res_dz.status_code == 200
    data_dz = res_dz.json()
    assert len(data_dz) >= 6
    assert "geometryJson" in data_dz[0]

def test_inventory_lifecycle(client):
    # 1. List lots
    res_list = client.get("/api/v1/inventory/lots")
    assert res_list.status_code == 200
    lots = res_list.json()
    assert len(lots) >= 11
    assert "daysToExpiry" in lots[0]

    # 2. Receive stock
    payload = {
        "id": "LOT-TEST-NEW-01",
        "name": "High-Protein Emergency Meal Packets",
        "commodity": "FOOD",
        "category": "Ready-to-Use Food",
        "batchId": "BATCH-TEST-999",
        "facilityId": "CSD-01",
        "quantity": 1200,
        "unit": "packets",
        "expiryDate": "2024-08-30",
        "qualityStatus": "VERIFIED_USABLE",
        "actor": "Test Receiving Officer",
        "reason": "Test emergency intake",
    }
    res_recv = client.post("/api/v1/inventory/receive", json=payload)
    assert res_recv.status_code == 201
    recv_data = res_recv.json()
    assert recv_data["id"] == "LOT-TEST-NEW-01"
    assert recv_data["usableQty"] == 1200

    # 3. Quarantine stock
    quar_payload = {
        "lotId": "LOT-TEST-NEW-01",
        "actor": "QA Field Inspector",
        "reason": "Package seal integrity failure during river transit",
    }
    res_quar = client.post("/api/v1/inventory/quarantine", json=quar_payload)
    assert res_quar.status_code == 200
    quar_data = res_quar.json()
    assert quar_data["qualityStatus"] == "QUARANTINED"
    assert quar_data["usableQty"] == 0.0
    assert quar_data["quarantinedQty"] == 1200.0

    # Cleanup test lot so baseline counts remain exact
    session = SessionLocal()
    session.execute(delete(InventoryTransaction).where(InventoryTransaction.lot_id == "LOT-TEST-NEW-01"))
    session.execute(delete(InventoryLot).where(InventoryLot.id == "LOT-TEST-NEW-01"))
    session.commit()
    session.close()

def test_demand_verification_lifecycle(client):
    # 1. List demands
    res_dem = client.get("/api/v1/demand/records")
    assert res_dem.status_code == 200
    demands = res_dem.json()
    assert len(demands) >= 11
    assert "remainingQuantity" in demands[0]

    # 2. Verify demand with PENDING status (DEM-2024-067)
    verify_payload = {
        "demandId": "DEM-2024-067",
        "verifiedBy": "Dr. Sarah Adams (WHO / Health Team)",
        "evidenceRef": "EVID-SURVEY-WHO-091",
        "notes": "Field clinic headcount verified. 120 cholera cases screened.",
    }
    res_ver = client.post("/api/v1/demand/verify", json=verify_payload)
    assert res_ver.status_code == 200
    ver_data = res_ver.json()
    assert ver_data["verificationStatus"] == "VERIFIED"
    assert ver_data["verificationDetailsJson"]["evidenceRef"] == "EVID-SURVEY-WHO-091"

def test_dispatch_and_pod_verification_lifecycle(client):
    # 1. List dispatches
    res_dsp = client.get("/api/v1/dispatch/orders")
    assert res_dsp.status_code == 200
    assert len(res_dsp.json()) >= 6

    # 2. Test rule: Cannot dispatch against unapproved plan
    fail_dsp_payload = {
        "planId": "PLAN-BETA", # PLAN-BETA is CANDIDATE, not APPROVED
        "destinationId": "GRP-01",
        "vehicle": "Amphibious Truck #04",
        "carrier": "UN Logistics Cluster",
        "driver": "Driver Ahmed",
        "routeName": "Route rt-4 (River Barge Flotilla)",
        "expectedArrival": "2024-07-06T12:00:00Z",
    }
    res_fail = client.post("/api/v1/dispatch/create", json=fail_dsp_payload)
    assert res_fail.status_code == 400
    assert "Human approval required" in res_fail.json()["detail"]

    # 3. Create dispatch against approved plan PLAN-ALPHA
    success_dsp_payload = {
        "id": "DSP-TEST-POD-01",
        "planId": "PLAN-ALPHA",
        "destinationId": "GRP-01",
        "destinationName": "Delta Estuary Evacuation Settlement",
        "vehicle": "River Barge Unit 03",
        "vehicleType": "RIVER_BARGE",
        "carrier": "UN Riverine Flotilla",
        "driver": "Capt. Mateus Nguenha",
        "routeName": "Commercial Supply Trunk Route",
        "expectedArrival": "2024-07-06T16:00:00Z",
        "actor": "Senior Logistics Officer Vance",
    }
    res_create = client.post("/api/v1/dispatch/create", json=success_dsp_payload)
    assert res_create.status_code == 201
    created_order = res_create.json()
    assert created_order["id"] == "DSP-TEST-POD-01"
    assert created_order["status"] == "IN_TRANSIT"

    # 4. Test POD verification reconciliation failure
    bad_pod_payload = {
        "dispatchId": "DSP-TEST-POD-01",
        "receivedQuantity": 1000,
        "acceptedQuantity": 800, # 800 + 100 = 900 != 1000
        "damagedQuantity": 100,
        "rejectedQuantity": 0,
        "adjustedQuantity": 0,
        "evidenceRef": "POD-TEST-ERR",
    }
    res_bad_pod = client.post("/api/v1/dispatch/verify-pod", json=bad_pod_payload)
    assert res_bad_pod.status_code == 400
    assert "Reconciliation error" in res_bad_pod.json()["detail"]

    # 5. Test POD verification success
    good_pod_payload = {
        "dispatchId": "DSP-TEST-POD-01",
        "deliveryId": "DEL-TEST-SUCCESS-01",
        "receivedQuantity": 1000,
        "acceptedQuantity": 900,
        "damagedQuantity": 80,
        "rejectedQuantity": 20,
        "adjustedQuantity": 0,
        "verifiedBy": "Camp Warehouse Receiver",
        "evidenceRef": "POD-SIGNED-CERT-081",
        "notes": "Inspected at Camp Delta dock. 900 pkts pristine, 80 water damaged, 20 rejected.",
    }
    res_good_pod = client.post("/api/v1/dispatch/verify-pod", json=good_pod_payload)
    assert res_good_pod.status_code == 200
    pod_data = res_good_pod.json()
    assert pod_data["status"] == "VERIFIED"
    assert pod_data["progressPct"] == 100.0
    assert pod_data["podJson"]["acceptedQty"] == 900

    # Cleanup test dispatch order
    session = SessionLocal()
    session.execute(delete(DeliveryRecord).where(DeliveryRecord.id == "DEL-TEST-SUCCESS-01"))
    session.execute(delete(DispatchOrder).where(DispatchOrder.id == "DSP-TEST-POD-01"))
    session.commit()
    session.close()

def test_audit_ledger_and_export(client):
    # 1. List audit events
    res_audit = client.get("/api/v1/audit/events")
    assert res_audit.status_code == 200
    events = res_audit.json()
    assert len(events) >= 10
    assert "entityId" in events[0]
    assert "action" in events[0]

    # 2. Export CSV
    res_csv = client.get("/api/v1/audit/export?format=csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    csv_text = res_csv.text
    assert "id,timestamp,user,role,action" in csv_text
    assert "EVT-" in csv_text

    # 3. Export TSV
    res_tsv = client.get("/api/v1/audit/export?format=tsv")
    assert res_tsv.status_code == 200
    assert "tab-separated-values" in res_tsv.headers["content-type"]
    assert "\t" in res_tsv.text
