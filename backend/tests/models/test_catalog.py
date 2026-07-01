from datetime import datetime
from decimal import Decimal

from merlins_collection.models.catalog import CatalogCard, FinishPrice, PricePoint


def test_catalog_card_defaults_and_decimal_prices():
    card = CatalogCard(
        card_id="swsh1-1",
        name="Celebi V",
        set_id="swsh1",
        set_name="Sword & Shield",
        number="1",
        images={"small": "s.png", "large": "l.png"},
        prices={"holofoil": {"market": Decimal("12.50")}},
        last_synced_at=datetime(2026, 6, 22, 12, 0, 0),
    )
    assert card.rarity is None
    assert card.types == []
    assert card.prices["holofoil"].market == Decimal("12.50")
    assert isinstance(card.prices["holofoil"], FinishPrice)


def test_price_point_graded_shape():
    p = PricePoint(
        card_id="swsh1-1", date="2026-06-22", source="manual",
        kind="graded", company="PSA", grade=Decimal("10"), market=Decimal("500"),
    )
    assert p.kind == "graded"
    assert p.grade == Decimal("10")
    assert p.finish is None
