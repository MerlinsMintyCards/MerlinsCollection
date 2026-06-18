from fastapi import APIRouter

# Cognito JWT validation and session endpoints — implemented via TDD
router = APIRouter(prefix="/auth", tags=["auth"])
