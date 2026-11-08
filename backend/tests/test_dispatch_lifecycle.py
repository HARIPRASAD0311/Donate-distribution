import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.dispatch import DispatchOrder, DeliveryRecord
from backend.app.models.demand import DemandRecord
from backend.app.models.audit import AuditEvent
from backend.app.models.allocation import AllocationPlan

client = TestClient(app)

def test_reject_dispatch_against_unapproved_plan():
    """HARD RULE: Nothing is dispatched without human approval (plan must be APPROVED)."""
    payload = {
        "planId": "PLAN-BETA", # PLAN-BETA is CANDIDATE (unapproved)
        "destinationId": "GRP-01",
        "vehicle": "Convoy Truck #12",
        "carrier": "UN Logistics Cluster",
        "driver": "Marcus Vance",
        "routeName": "RT-MZ-BARGE",
        "expectedArrival": "2024-07-06T18:00:00Z"
    }
    # Reset PLAN-BETA to CANDIDATE if previously modified
    with SessionLocal() as db:
        p = db.query(AllocationPlan).filter(AllocationPlan.id == "PLAN-BETA").first()
        if p:
            p.status = "CANDIDATE"
            db.commit()

    response = client.post("/api/v1/dispatch/create", json=payload)
    assert response.status_code == 400
    assert "Human approval required" in response.json()["detail"]

def test_reject_dispatch_on_blocked_corridor():
    """HARD RULE: Blocked routes are never usable for dispatch."""
    payload = {
        "planId": "PLAN-ALPHA", # Approved plan
        "destinationId": "GRP-01",
        "vehicle": "10-Ton Cargo Truck",
        "carrier": "WFP Fleet",
        "driver": "A. Rahman",
        "routeName": "RT-MZ-CSD-DC2", # Known culvert washout blocked corridor
        "expectedArrival": "2024-07-06T18:00:00Z"
    }
    response = client.post("/api/v1/dispatch/create", json=payload)
    assert response.status_code == 400
    assert "currently BLOCKED" in response.json()["detail"]

def test_create_dispatch_against_approved_plan():
    """Verify dispatch creation against approved plan writes AuditEvent and sets IN_TRANSIT."""
    order_id = "DSP-TEST-LIFECYCLE-01"
    payload = {
        "id": order_id,
        "planId": "PLAN-ALPHA",
        "destinationId": "GRP-01",
        "destinationName": "Delta Estuary Settlement",
        "vehicle": "Shallow-Draft River Barge BRG-02",
        "vehicleType": "RIVER_BARGE",
        "carrier": "Buzi Estuary Marine Fleet",
        "driver": "Capt. M. Farooq",
        "routeName": "RT-MZ-BARGE", # Passable barge channel
        "expectedArrival": "2024-07-05T17:30:00Z",
        "actor": "Incident Logistics Director",
        "notes": "Emergency food convoy departing Port Alpha"
    }
    response = client.post("/api/v1/dispatch/create", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["id"] == order_id
    assert data["status"] == "IN_TRANSIT"
    assert data["routeStatus"] == "PASSABLE_WATERWAY"

    # Verify AuditEvent was appended
    with SessionLocal() as db:
        event = db.query(AuditEvent).filter(
            AuditEvent.action == "DISPATCH_ORDER_CREATED",
            AuditEvent.entity_id == order_id
        ).first()
        assert event is not None
        assert event.user == "Incident Logistics Director"
        assert event.approval_ref == "PLAN-ALPHA"

def test_dispatch_lifecycle_depart_and_arrive():
    """Verify state transitions: depart and arrive update progress and append AuditEvents."""
    order_id = "DSP-2026-004" # PREPARING order in seeded data

    # 1. Depart
    depart_res = client.post(f"/api/v1/dispatch/{order_id}/depart", json={
        "actor": "Convoy Captain",
        "notes": "Clearance confirmed by marine dispatch"
    })
    assert depart_res.status_code == 200
    assert depart_res.json()["status"] == "IN_TRANSIT"

    # 2. Arrive
    arrive_res = client.post(f"/api/v1/dispatch/{order_id}/arrive", json={
        "actor": "Camp Reception Gate Officer",
        "notes": "Moored at Delta temporary pontoon jetty"
    })
    assert arrive_res.status_code == 200
    assert arrive_res.json()["status"] == "ARRIVED_AWAITING_POD"

    # Verify arrival AuditEvent
    with SessionLocal() as db:
        event = db.query(AuditEvent).filter(
            AuditEvent.action == "DISPATCH_ARRIVED",
            AuditEvent.entity_id == order_id
        ).first()
        assert event is not None
        assert event.status == "ARRIVED_AWAITING_POD"

def test_reroute_dispatch_enforces_route_passability():
    """Verify rerouting an in-transit order to avoid road blockages."""
    order_id = "DSP-TEST-LIFECYCLE-01"

    # 1. Attempt to reroute over blocked corridor -> fails
    blocked_res = client.post(f"/api/v1/dispatch/{order_id}/reroute", json={
        "newRouteName": "RT-MZ-CSD-DC2",
        "justification": "Attempting washout crossing",
        "actor": "Operator"
    })
    assert blocked_res.status_code == 400
    assert "currently BLOCKED" in blocked_res.json()["detail"]

    # 2. Reroute over passable bypass corridor -> succeeds
    passable_res = client.post(f"/api/v1/dispatch/{order_id}/reroute", json={
        "newRouteName": "RT-MZ-HIGH-BYPASS",
        "justification": "Culvert collapse at km 42; rerouting via Northern Highland unpaved route",
        "actor": "Senior Logistics Coordinator"
    })
    assert passable_res.status_code == 200
    assert passable_res.json()["routeName"] == "RT-MZ-HIGH-BYPASS"

def test_proof_of_delivery_reconciliation_and_demand_fulfillment():
    """
    CRITICAL RECONCILIATION RULE:
    1. receivedQuantity == accepted + damaged + rejected + adjusted (arithmetic check).
    2. Documented reason required if adjusted > 0.
    3. ONLY accepted quantity fulfils linked demand (damaged/rejected are loss).
    """
    order_id = "DSP-TEST-LIFECYCLE-01"

    # 1. Arithmetic mismatch: 100 received != 70 + 10 + 5 + 0 = 85
    mismatch_payload = {
        "dispatchId": order_id,
        "receivedQuantity": 100.0,
        "acceptedQuantity": 70.0,
        "damagedQuantity": 10.0,
        "rejectedQuantity": 5.0,
        "adjustedQuantity": 0.0,
        "evidenceRef": "POD-DOC-001"
    }
    res_mismatch = client.post("/api/v1/dispatch/verify-pod", json=mismatch_payload)
    assert res_mismatch.status_code == 400
    assert "Reconciliation error" in res_mismatch.json()["detail"]

    # 2. Adjustment missing reason
    no_reason_payload = {
        "dispatchId": order_id,
        "receivedQuantity": 100.0,
        "acceptedQuantity": 80.0,
        "damagedQuantity": 10.0,
        "rejectedQuantity": 0.0,
        "adjustedQuantity": 10.0,
        "adjustmentReason": None,
        "evidenceRef": "POD-DOC-002"
    }
    res_no_reason = client.post("/api/v1/dispatch/verify-pod", json=no_reason_payload)
    assert res_no_reason.status_code == 400
    assert "adjustment reason is required" in res_no_reason.json()["detail"]

    # 3. Exact valid reconciliation: 1000 = 850 accepted + 100 damaged + 50 rejected
    valid_pod_payload = {
        "dispatchId": order_id,
        "deliveryId": "DEL-TEST-001",
        "receivedQuantity": 1000.0,
        "acceptedQuantity": 850.0,
        "damagedQuantity": 100.0,
        "rejectedQuantity": 50.0,
        "adjustedQuantity": 0.0,
        "verifiedBy": "Nurse Muthemba (Clinic Intake Lead)",
        "evidenceRef": "WAYBILL-STAMPED-2024-88",
        "notes": "100 cartons water-damaged during river transit; 50 rejected due to seal tear; 850 accepted potable."
    }
    res_valid = client.post("/api/v1/dispatch/verify-pod", json=valid_pod_payload)
    assert res_valid.status_code == 200
    order_data = res_valid.json()

    assert order_data["status"] == "VERIFIED"
    assert order_data["progressPct"] == 100.0
    assert order_data["podJson"]["acceptedQty"] == 850.0
    assert order_data["podJson"]["damagedQty"] == 100.0
    assert order_data["podJson"]["rejectedQty"] == 50.0

    # 4. Check linked DemandRecord was fulfilled strictly by accepted (850)
    with SessionLocal() as db:
        order = db.query(DispatchOrder).filter(DispatchOrder.id == order_id).first()
        deliv = db.query(DeliveryRecord).filter(DeliveryRecord.dispatch_id == order_id).first()
        assert deliv is not None
        assert deliv.accepted_quantity == 850.0
        assert deliv.damaged_quantity == 100.0

        # Verify AuditEvent
        audit = db.query(AuditEvent).filter(
            AuditEvent.action == "POD_VERIFIED",
            AuditEvent.entity_id == order_id
        ).first()
        assert audit is not None
        assert audit.user == "Nurse Muthemba (Clinic Intake Lead)"
        assert "Accepted: 850" in audit.new_value

        # Clean up test records
        db.delete(deliv)
        db.delete(order)
        db.commit()
