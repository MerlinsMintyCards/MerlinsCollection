"""FastAPI auth dependencies built on the Cognito JWT verifier.

``get_verifier`` is a cached singleton built from settings; tests override it
via ``app.dependency_overrides``. ``get_current_user`` enforces a valid bearer
token (401 on missing/invalid, 503 when signing keys can't be fetched), and
``require_admin`` gates admin-only routes (403).
"""

from __future__ import annotations

import json
from functools import lru_cache

import boto3
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from merlins_collection.config import settings
from merlins_collection.models.auth import AuthenticatedUser
from merlins_collection.services.bedrock import BedrockChatService
from merlins_collection.services.cognito import (
    CognitoJwtVerifier,
    InvalidTokenError,
    JwksUnavailableError,
)
from merlins_collection.services.dynamodb import InventoryRepository

# auto_error=False so a missing credential yields our own 401 (with a
# WWW-Authenticate header) rather than FastAPI's default 403.
_bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_repo() -> InventoryRepository:
    """Provide the inventory repository as a cached singleton."""
    return InventoryRepository(settings.dynamodb_table_name, region_name=settings.aws_region)


def get_bedrock_service() -> BedrockChatService:
    """Provide a Bedrock chat service with a (temporary) stub tool executor.

    Not cached: the MCP-backed tool executor isn't wired up yet, so this is
    expected to be rebuilt once ``mcp_client`` lands. Until then the stub makes
    every tool call return a "not configured" message instead of real data.
    """
    client = boto3.client("bedrock-runtime", region_name=settings.aws_region)

    def _stub_executor(tool_name: str, tool_input: dict) -> str:
        return json.dumps({"error": "MCP tool executor not yet configured", "tool": tool_name})

    return BedrockChatService(
        client=client,
        model_id=settings.bedrock_model_id,
        tool_executor=_stub_executor,
    )


@lru_cache
def get_verifier() -> CognitoJwtVerifier:
    """Provide the Cognito JWT verifier as a cached singleton (keeps the JWKS cache warm)."""
    return CognitoJwtVerifier(
        region=settings.aws_region,
        user_pool_id=settings.cognito_user_pool_id,
        client_id=settings.cognito_client_id,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    verifier: CognitoJwtVerifier = Depends(get_verifier),
) -> AuthenticatedUser:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return verifier.verify(credentials.credentials)
    except JwksUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable",
        ) from exc
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def require_admin(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
