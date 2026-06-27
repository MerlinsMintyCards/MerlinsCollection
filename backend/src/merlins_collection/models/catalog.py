"""Catalog + price-history models, derived from pokemontcg.io data.

``CatalogCard`` is the reference data for a card (name, set, images, current
prices per finish), synced daily. ``PricePoint`` is one dated observation kept
for history — raw (per finish) or graded (per company/grade).
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class CardImages(BaseModel):
    """Hosted image URLs for a card."""

    small: str
    large: str


class FinishPrice(BaseModel):
    """TCGplayer price band for one finish (all fields optional/absent)."""

    market: Decimal | None = None
    low: Decimal | None = None
    mid: Decimal | None = None
    high: Decimal | None = None


class CatalogCard(BaseModel):
    """Reference data for a single card; ``prices`` is keyed by finish name."""

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
    """One dated price observation. ``kind`` decides which fields apply.

    Raw points carry ``finish``; graded points carry ``company`` + ``grade``.
    ``source`` records where the figure came from (e.g. ``pokemontcg.io``).
    """

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
