from fastapi import APIRouter

# Structured inventory search (filter mode) — implemented via TDD
router = APIRouter(prefix="/inventory", tags=["inventory"])
