import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.recovery import RecoverySimulation, RecoveryStrategy
from backend.app.models.audit import AuditEvent

client = TestClient(app)

def test_simulate_recovery_simpy_monte_carlo():
    """Verify SimPy discrete-event Monte Carlo simulation and 95% CVaR risk tail."""
    sim_config = {
        "baselinePlanId": "PLAN-ALPHA",
        "numRuns": 150,
        "timeHorizonHours": 72.0,
        "disruptionScenario": {
            "name": "Cyclone Idai II: Major Culvert Washout & Flash Inundation",
            "category": "FLOOD"
        }
    }
    response = client.post("/api/v1/recovery/simulate", json=sim_config)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "SUCCESS"
    assert data["computedBy"] == "engine"
    assert "SimPy" in data["engine"]
    assert data["numRuns"] == 150

    # Verify 8 Analytics Datasets
    analytics = data["analytics"]
    
    # 1. Monte Carlo Distribution
    mc_dist = analytics["monteCarloDistribution"]
    assert len(mc_dist) == 6
    total_runs_disrupted = sum(b["runsDisrupted"] for b in mc_dist)
    total_runs_alpha = sum(b["runsAlpha"] for b in mc_dist)
    assert total_runs_disrupted == 150
    assert total_runs_alpha == 150

    # 2. CVaR Comparison (95% tail risk)
    cvar_comp = analytics["cvarComparison"]
    assert len(cvar_comp) == 4
    disrupted_cvar = next(c for c in cvar_comp if c["strategy"] == "Disrupted State")
    alpha_cvar = next(c for c in cvar_comp if c["strategy"] == "Strategy Alpha")
    # Alpha strategy must significantly mitigate tail loss compared to disrupted state
    assert alpha_cvar["cvar95"] < disrupted_cvar["cvar95"]
    assert alpha_cvar["riskTier"] == "LOW_RISK"
    assert disrupted_cvar["riskTier"] == "HIGH_RISK"

    # 3. Recovery Time Distribution (Boxplots)
    r_times = analytics["recoveryTimeDistribution"]
    assert len(r_times) == 4
    for r in r_times:
        assert r["min"] <= r["q1"] <= r["median"] <= r["q3"] <= r["max"]

    # 4. Shortage Distribution
    assert len(analytics["shortageDistribution"]) > 0

    # 5. Strategy Comparison
    assert len(analytics["strategyComparison"]) == 3

    # 6. Scenario Comparison
    assert len(analytics["scenarioComparison"]) == 3

    # 7. Recovery Timeline
    assert len(analytics["recoveryTimeline"]) == 6

    # 8. Resource Utilization
    assert len(analytics["resourceUtilizationAfterRecovery"]) == 4

    # Candidate strategies
    strategies = data["strategies"]
    assert len(strategies) == 3
    alpha_strat = next(s for s in strategies if s["id"] == "STRAT-ALPHA")
    assert alpha_strat["computedBy"] == "engine"
    assert alpha_strat["criticalCoveragePct"] == 100.0

def test_validate_recovery_action_passable_corridor():
    """Verify validation passes when routing via a passable waterway/bypass."""
    payload = {
        "actionType": "ACTIVATE_BARGE",
        "targetRouteId": "RT-MZ-CSD-DC2", # Blocked highway
        "alternativeRouteId": "RT-MZ-BARGE", # Passable barge channel
        "targetFacilityId": "FAC-01"
    }
    response = client.post("/api/v1/recovery/validate-action", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["isValid"] is True
    assert len(data["errors"]) == 0
    assert "WATERWAY" in data["throughputImpact"] or "RESTORED" in data["throughputImpact"]

def test_validate_recovery_action_blocked_bypass():
    """Verify validation fails if proposed alternative route is itself blocked."""
    payload = {
        "actionType": "REROUTE_CORRIDOR",
        "targetRouteId": "RT-MZ-CSD-DC1",
        "alternativeRouteId": "RT-MZ-CSD-DC2", # Known culvert washout!
    }
    response = client.post("/api/v1/recovery/validate-action", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["isValid"] is False
    assert any("BLOCKED" in err for err in data["errors"])

def test_approve_strategy_stale_baseline_check():
    """
    CRITICAL HARD RULE:
    Rejects strategy approval if baseline operational state changed or is stale.
    """
    payload = {
        "approvedBy": "Operational Commander",
        "baselineSnapshotId": "STALE_SNAPSHOT",
        "notes": "Attempting sign-off with out-of-date state"
    }
    response = client.post("/api/v1/recovery/strategies/STRAT-ALPHA/approve", json=payload)
    assert response.status_code == 409
    assert "STALE BASELINE CONFLICT" in response.json()["detail"]

def test_approve_strategy_success_and_audit():
    """Verify human approval writes APPROVED status and creates AuditEvent."""
    payload = {
        "approvedBy": "Col. John Mercer (Taskforce Commander)",
        "notes": "Emergency barge flotilla authorized for Delta sector."
    }
    response = client.post("/api/v1/recovery/strategies/STRAT-ALPHA/approve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == "STRAT-ALPHA"
    assert data["status"] == "APPROVED"
    assert data["approvedBy"] == "Col. John Mercer (Taskforce Commander)"
    assert data["approvedAt"] is not None

    # Verify AuditEvent in database
    with SessionLocal() as db:
        event = db.query(AuditEvent).filter(
            AuditEvent.action == "RECOVERY_STRATEGY_APPROVED",
            AuditEvent.entity_id == "STRAT-ALPHA"
        ).first()
        assert event is not None
        assert event.user == "Col. John Mercer (Taskforce Commander)"
        assert event.module == "Recovery Simulator"
