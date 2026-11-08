import pytest
from fastapi.testclient import TestClient

from backend.app.core.database import SessionLocal, get_db
from backend.app.data_importer import import_all
from backend.app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Reset and seed the SQLite database from synthetic fixtures for the test session."""
    import_all(reset_db=True)
    yield

@pytest.fixture(scope="module")
def client():
    """Test client accessing the seeded test database."""
    with TestClient(app) as test_client:
        yield test_client

