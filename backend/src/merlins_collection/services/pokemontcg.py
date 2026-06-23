from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from merlins_collection.models.catalog import CardImages, CatalogCard, FinishPrice


def _dec(value) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def to_catalog_card(raw: dict, *, synced_at: datetime | None = None) -> CatalogCard:
    synced_at = synced_at or datetime.now(timezone.utc)
    tcg_prices = ((raw.get("tcgplayer") or {}).get("prices")) or {}
    prices = {
        finish: FinishPrice(
            market=_dec(p.get("market")),
            low=_dec(p.get("low")),
            mid=_dec(p.get("mid")),
            high=_dec(p.get("high")),
        )
        for finish, p in tcg_prices.items()
    }
    images = raw.get("images") or {}
    card_set = raw.get("set") or {}
    return CatalogCard(
        card_id=raw["id"],
        name=raw["name"],
        set_id=card_set.get("id", ""),
        set_name=card_set.get("name", ""),
        number=raw.get("number", ""),
        rarity=raw.get("rarity"),
        types=raw.get("types", []),
        images=CardImages(small=images.get("small", ""), large=images.get("large", "")),
        prices=prices,
        last_synced_at=synced_at,
    )
