"""Request/response models for the ``/chat`` (AI chat mode) endpoint."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """A user chat message. Bounded to 1–4000 chars to reject empty / abusive input."""

    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    """The assistant's text reply."""

    reply: str
