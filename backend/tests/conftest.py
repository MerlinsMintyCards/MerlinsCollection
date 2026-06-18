import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from merlins_collection.main import app
    return TestClient(app)
