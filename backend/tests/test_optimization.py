import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.allocation import AllocationPlan, AllocationLine
from backend.app.models.audit import AuditEvent

client = TestClient(app)

def test_validate_optimization_inputs():
    """Verify input readiness, constraint boundaries, and commodity validation checks."""
    payload = {
        "incidentId": "INC-2026-0412",
        "commodities": ["FOOD", "WATER"],
        "sourceFacilities": ["FAC-01", "FAC-02"],
        "destinationRegions": ["Assam Valley Sector"],
        "reserveMarginPct": 15.0,
        "budgetCapUSD": 250000.0,
        "planningPeriod": "72h"
    }
    response = client.post("/api/v1/optimize/validate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "SUCCESS"
    assert data["isValid"] is True
    # Non-food streams should trigger a non-fatal warning as per spec
    assert any("certified for FOOD only" in w for w in data["warnings"])

    # Verify audit checks
    check_ids = {c["id"] for c in data["auditChecks"]}
    assert "chk-commodities" in check_ids
    assert "chk-sources" in check_ids
    assert "chk-destinations" in check_ids
    assert "chk-reserve" in check_ids
    assert "chk-routes" in check_ids
    assert "chk-constraints" in check_ids

    # Matrix dimensions
    matrix = data["matrixDimensions"]
    assert matrix["decisionVariables"] > 0
    assert matrix["constraints"] > 0
    assert matrix["timeHorizon"] == "72h"

def test_execute_milp_highs_solver():
    """Verify Pyomo + HiGHS optimization engine execution for FOOD allocation."""
    job_config = {
        "planId": "PLAN-ENG-TEST",
        "incidentId": "INC-2026-0412",
        "commodities": ["FOOD"],
        "reserveMarginPct": 15.0,
        "minEquityGini": 0.20,
        "objectiveWeights": {"welfare": 0.5, "equity": 0.3, "cost": 0.2}
    }
    response = client.post("/api/v1/optimize/milp", json=job_config)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "SUCCESS"
    assert data["computedBy"] == "engine"
    assert "HiGHS" in data["solverName"]
    assert data["feasibility"] == "OPTIMAL_FEASIBLE"
    assert data["humanitarianWelfareScore"] > 0.0
    assert data["giniCoefficient"] > 0.0

    plan = data["plan"]
    assert plan["id"] == "PLAN-ENG-TEST"
    assert plan["computedBy"] == "engine"
    assert plan["status"] == "CANDIDATE"
    assert len(plan["allocations"]) > 0

    first_line = plan["allocations"][0]
    assert first_line["commodity"] == "FOOD"
    assert first_line["allocatedQty"] > 0
    assert first_line["sourceFacilityId"] in ("FAC-01", "FAC-02", "CSD-01", "NLB-02", "SRD-03")
    assert first_line["validationStatus"] == "VALIDATED"
    assert "Route" in first_line["route"]

    # Diagnostics
    diag = data["constraintDiagnostics"]
    assert diag["totalConstraints"] > 0
    assert len(diag["bindingConstraints"]) > 0

    # Clean up test plan from DB
    with SessionLocal() as db:
        plan_obj = db.query(AllocationPlan).filter(AllocationPlan.id == "PLAN-ENG-TEST").first()
        if plan_obj:
            db.query(AllocationLine).filter(AllocationLine.plan_id == "PLAN-ENG-TEST").delete()
            db.delete(plan_obj)
            db.commit()

def test_approve_plan_and_create_audit():
    """Verify human-in-the-loop approval: sets APPROVED status and writes AuditEvent."""
    approve_payload = {
        "approvedBy": "Dr. Sarah Jenkins (Incident Commander)",
        "notes": "Verified food reserve margins and approved barge transit."
    }
    response = client.post("/api/v1/optimize/plans/PLAN-BETA/approve", json=approve_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == "PLAN-BETA"
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "Dr. Sarah Jenkins (Incident Commander)"
    assert data["approvedAt"] is not None

    # Verify AuditEvent was appended
    with SessionLocal() as db:
        event = db.query(AuditEvent).filter(
            AuditEvent.action == "PLAN_APPROVED",
            AuditEvent.entity_id == "PLAN-BETA"
        ).first()
        assert event is not None
        assert event.user == "Dr. Sarah Jenkins (Incident Commander)"
        assert event.module == "Allocation Engine"

def test_reject_plan_and_release():
    """Verify plan rejection transitions status to REJECTED and appends AuditEvent."""
    reject_payload = {
        "rejectedBy": "Major Alex Vance (Transport Lead)",
        "reason": "River levels rising; requiring hovercraft rather than standard trucks."
    }
    response = client.post("/api/v1/optimize/plans/PLAN-GAMMA/reject", json=reject_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == "PLAN-GAMMA"
    assert data["status"] == "REJECTED"
    assert "Rejected: River levels rising" in data["approvalNotes"]

    # Verify AuditEvent was appended
    with SessionLocal() as db:
        event = db.query(AuditEvent).filter(
            AuditEvent.action == "PLAN_REJECTED",
            AuditEvent.entity_id == "PLAN-GAMMA"
        ).first()
        assert event is not None
        assert event.user == "Major Alex Vance (Transport Lead)"

def test_get_plan_history():
    """Verify retrieval of historical versions, seeded plans, and approvals."""
    response = client.get("/api/v1/optimize/plans/history")
    assert response.status_code == 200
    plans = response.json()

    assert isinstance(plans, list)
    assert len(plans) >= 3
    plan_ids = [p["id"] for p in plans]
    assert "PLAN-ALPHA" in plan_ids
    assert "PLAN-BETA" in plan_ids
    assert "PLAN-GAMMA" in plan_ids

    # Each plan must carry computedBy ('seed' or 'engine')
    for p in plans:
        assert p["computedBy"] in ("seed", "engine")
        assert "allocations" in p

def test_end_to_end_solve_and_human_approval():
    """Verify solving via HiGHS engine, then human approval commits stock reservation."""
    # 1. Solve via HiGHS
    solve_res = client.post("/api/v1/optimize/milp", json={
        "planId": "PLAN-E2E-HIHGS",
        "incidentId": "INC-2026-0412",
        "commodities": ["FOOD"],
        "reserveMarginPct": 15.0
    })
    assert solve_res.status_code == 200
    solve_data = solve_res.json()
    assert solve_data["computedBy"] == "engine"
    assert solve_data["plan"]["status"] == "CANDIDATE"

    try:
        # 2. Approve Candidate Plan
        approve_res = client.post("/api/v1/optimize/plans/PLAN-E2E-HIHGS/approve", json={
            "approvedBy": "General Commander",
            "notes": "Fast-tracked for Delta Estuary evacuation"
        })
        assert approve_res.status_code == 200
        approved_data = approve_res.json()
        assert approved_data["status"] == "APPROVED"
        assert approved_data["computedBy"] == "engine"
        assert approved_data["approvedBy"] == "General Commander"

        # 3. Verify in DB
        with SessionLocal() as db:
            audit = db.query(AuditEvent).filter(
                AuditEvent.action == "PLAN_APPROVED",
                AuditEvent.entity_id == "PLAN-E2E-HIHGS"
            ).first()
            assert audit is not None
            assert audit.user == "General Commander"
    finally:
        with SessionLocal() as db:
            p = db.query(AllocationPlan).filter(AllocationPlan.id == "PLAN-E2E-HIHGS").first()
            if p:
                db.query(AllocationLine).filter(AllocationLine.plan_id == "PLAN-E2E-HIHGS").delete()
                db.delete(p)
                db.commit()

