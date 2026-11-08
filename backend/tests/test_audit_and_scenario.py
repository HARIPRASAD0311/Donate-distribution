import csv
import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)

def test_audit_export_csv():
    """Verify streaming RFC-4180 CSV export of immutable audit events."""
    response = client.get("/api/v1/audit/export?format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    assert "resqnet-audit-events.csv" in response.headers["content-disposition"]

    content = response.text
    reader = csv.reader(io.StringIO(content))
    header = next(reader)
    assert "id" in header
    assert "timestamp" in header
    assert "action" in header
    assert "user" in header
    assert "module" in header

    rows = list(reader)
    assert len(rows) > 0 # Audit ledger has historical events

def test_audit_export_tsv():
    """Verify streaming RFC-4180 TSV export of immutable audit events."""
    response = client.get("/api/v1/audit/export?format=tsv")
    assert response.status_code == 200
    assert "text/tab-separated-values" in response.headers["content-type"]
    assert "resqnet-audit-events.tsv" in response.headers["content-disposition"]

    content = response.text
    reader = csv.reader(io.StringIO(content), delimiter="\t")
    header = next(reader)
    assert header[0] == "id"
    assert "action" in header

    rows = list(reader)
    assert len(rows) > 0

def test_scenario_status_telemetry():
    """Verify scenario clock reference, scope support, and engine telemetry."""
    response = client.get("/api/v1/scenario/status")
    assert response.status_code == 200
    data = response.json()

    assert data["scenarioNow"] == settings.SCENARIO_NOW_STR
    assert data["isSupported"] is True
    assert data["crisisType"] == "Flood"
    assert "Assam" in data["region"]
    assert data["dataFreshness"] == "SYNCHRONIZED_WITH_SCENARIO_CLOCK"
    assert "FOOD" in data["supportedCommodities"]
    assert "HiGHS" in data["optimizationEngine"]
    assert "SimPy" in data["simulationEngine"]

def test_scenario_now_endpoint():
    """Verify lightweight scenario clock anchor endpoint."""
    response = client.get("/api/v1/scenario/now")
    assert response.status_code == 200
    data = response.json()
    assert data["scenarioNow"] == settings.SCENARIO_NOW_STR

