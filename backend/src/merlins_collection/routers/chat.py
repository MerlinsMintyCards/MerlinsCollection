from fastapi import APIRouter

# AI chat endpoint via Bedrock + MCP (chat mode) — implemented via TDD
router = APIRouter(prefix="/chat", tags=["chat"])
