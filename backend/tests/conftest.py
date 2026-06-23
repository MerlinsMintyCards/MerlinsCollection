import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from merlins_collection.main import app
    return TestClient(app)


@pytest.fixture
def dynamo_repo():
    from moto import mock_aws

    with mock_aws():
        os.environ["AWS_ACCESS_KEY_ID"] = "testing"
        os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
        os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
        from merlins_collection.services.dynamodb import InventoryRepository

        repo = InventoryRepository("merlins-cards-test", region_name="us-east-1")
        repo.create_table()
        yield repo
