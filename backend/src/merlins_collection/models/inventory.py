from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, TypeAdapter


class Condition(StrEnum):
    NM = "NM"
    LP = "LP"
    MP = "MP"
    HP = "HP"
    DMG = "DMG"


class GradingCompany(StrEnum):
    PSA = "PSA"
    BGS = "BGS"
    CGC = "CGC"
    SGC = "SGC"


class _ItemBase(BaseModel):
    card_id: str
    quantity: int
    listed_price: Decimal
    cost_basis: Decimal
    current_market_value: Decimal | None = None
    acquired_at: date


class RawInventoryItem(_ItemBase):
    kind: Literal["raw"] = "raw"
    finish: str
    condition: Condition


class GradedInventoryItem(_ItemBase):
    kind: Literal["graded"] = "graded"
    company: GradingCompany
    grade: Decimal
    cert_number: str


InventoryItem = Annotated[
    Union[RawInventoryItem, GradedInventoryItem],
    Field(discriminator="kind"),
]

InventoryItemAdapter: TypeAdapter[InventoryItem] = TypeAdapter(InventoryItem)


class InventorySearchResult(BaseModel):
    items: list[InventoryItem]
    total: int
