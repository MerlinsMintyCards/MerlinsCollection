from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class CardImages(BaseModel):
    small: str
    large: str


class FinishPrice(BaseModel):
    market: Decimal | None = None
    low: Decimal | None = None
    mid: Decimal | None = None
    high: Decimal | None = None


class CatalogCard(BaseModel):
    card_id: str
    name: str
    set_id: str
    set_name: str
    number: str
    rarity: str | None = None
    types: list[str] = []
    images: CardImages
    prices: dict[str, FinishPrice] = {}
    last_synced_at: datetime


class PricePoint(BaseModel):
    card_id: str
    date: date
    source: str
    kind: Literal["raw", "graded"]
    finish: str | None = None
    company: str | None = None
    grade: Decimal | None = None
    market: Decimal | None = None
    low: Decimal | None = None
    mid: Decimal | None = None
    high: Decimal | None = None
