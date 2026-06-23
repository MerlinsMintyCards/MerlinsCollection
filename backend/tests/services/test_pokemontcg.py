from datetime import datetime
from decimal import Decimal

from merlins_collection.services.pokemontcg import to_catalog_card

SAMPLE = {
    "id": "swsh1-1",
    "name": "Celebi V",
    "number": "1",
    "rarity": "Rare Holo V",
    "types": ["Grass"],
    "set": {"id": "swsh1", "name": "Sword & Shield"},
    "images": {"small": "s.png", "large": "l.png"},
    "tcgplayer": {"prices": {
        "holofoil": {"low": 5.0, "mid": 8.0, "high": 20.0, "market": 9.25},
        "reverseHolofoil": {"market": 6.5},
    }},
}


def test_maps_core_fields_and_decimal_prices():
    card = to_catalog_card(SAMPLE, synced_at=datetime(2026, 6, 22, 12, 0, 0))
    assert card.card_id == "swsh1-1"
    assert card.set_id == "swsh1"
    assert card.types == ["Grass"]
    assert card.prices["holofoil"].market == Decimal("9.25")
    assert card.prices["reverseHolofoil"].market == Decimal("6.5")
    assert card.prices["holofoil"].low == Decimal("5.0")


def test_card_without_tcgplayer_prices_maps_to_empty():
    raw = {"id": "p-1", "name": "Promo", "number": "1",
           "set": {"id": "promo", "name": "Promo"},
           "images": {"small": "s", "large": "l"}}
    card = to_catalog_card(raw)
    assert card.prices == {}
    assert card.rarity is None
