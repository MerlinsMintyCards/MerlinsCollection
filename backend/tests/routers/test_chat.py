from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from merlins_collection.services.bedrock import (
    BedrockContentFilteredError,
    BedrockLoopError,
    BedrockThrottledError,
)


@pytest.fixture
def chat_client(cognito_config, jwks):
    """TestClient with auth overridden; bedrock service is overridden per-test."""
    from merlins_collection.dependencies import get_verifier
    from merlins_collection.main import app
    from merlins_collection.services.cognito import CognitoJwtVerifier

    verifier = CognitoJwtVerifier(
        region=cognito_config["region"],
        user_pool_id=cognito_config["user_pool_id"],
        client_id=cognito_config["client_id"],
        jwks=jwks,
    )
    app.dependency_overrides[get_verifier] = lambda: verifier
    yield TestClient(app)
    app.dependency_overrides.clear()


def _stub_bedrock(reply: str):
    svc = MagicMock()
    svc.chat.return_value = reply
    return svc


def _override_bedrock(app, svc):
    from merlins_collection.dependencies import get_bedrock_service
    app.dependency_overrides[get_bedrock_service] = lambda: svc


# ---- auth ----

def test_chat_requires_authentication(chat_client):
    resp = chat_client.post("/chat/", json={"message": "Hello"})
    assert resp.status_code == 401


# ---- happy path ----

def test_chat_returns_reply_with_valid_auth(chat_client, mint_token):
    from merlins_collection.main import app
    svc = _stub_bedrock("We have 5 Charizard cards.")
    _override_bedrock(app, svc)

    resp = chat_client.post(
        "/chat/",
        json={"message": "Do you have Charizard?"},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 200
    assert resp.json()["reply"] == "We have 5 Charizard cards."
    svc.chat.assert_called_once_with("Do you have Charizard?")


# ---- input validation ----

def test_chat_rejects_empty_message(chat_client, mint_token):
    resp = chat_client.post(
        "/chat/",
        json={"message": ""},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 422


def test_chat_rejects_message_too_long(chat_client, mint_token):
    resp = chat_client.post(
        "/chat/",
        json={"message": "x" * 4001},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 422


# ---- error mapping ----

def test_chat_returns_503_on_loop_error(chat_client, mint_token):
    from merlins_collection.main import app
    svc = MagicMock()
    svc.chat.side_effect = BedrockLoopError("too many tool turns")
    _override_bedrock(app, svc)

    resp = chat_client.post(
        "/chat/",
        json={"message": "Search forever"},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 503


def test_chat_returns_429_on_throttling(chat_client, mint_token):
    from merlins_collection.main import app
    svc = MagicMock()
    svc.chat.side_effect = BedrockThrottledError("throttled")
    _override_bedrock(app, svc)

    resp = chat_client.post(
        "/chat/",
        json={"message": "Hello"},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 429


def test_chat_returns_502_on_bedrock_service_error(chat_client, mint_token):
    from merlins_collection.main import app
    from merlins_collection.services.bedrock import BedrockServiceError
    svc = MagicMock()
    svc.chat.side_effect = BedrockServiceError("model error")
    _override_bedrock(app, svc)

    resp = chat_client.post(
        "/chat/",
        json={"message": "Hello"},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 502


def test_chat_returns_422_on_content_filtered(chat_client, mint_token):
    from merlins_collection.main import app
    svc = MagicMock()
    svc.chat.side_effect = BedrockContentFilteredError("filtered")
    _override_bedrock(app, svc)

    resp = chat_client.post(
        "/chat/",
        json={"message": "Inappropriate query"},
        headers={"Authorization": f"Bearer {mint_token()}"},
    )
    assert resp.status_code == 422
