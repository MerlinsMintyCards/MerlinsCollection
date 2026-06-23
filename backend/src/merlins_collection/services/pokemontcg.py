from __future__ import annotations

import time
from collections.abc import Iterator
from datetime import datetime, timezone
from decimal import Decimal

import httpx

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


class PokemonTcgError(RuntimeError):
    def __init__(self, message, *, status_code=None):
        super().__init__(message)
        self.status_code = status_code


class PokemonTcgClient:
    BASE_URL = "https://api.pokemontcg.io/v2"

    def __init__(self, api_key="", *, client=None, page_size=250, max_retries=3, backoff_base=0.5):
        headers = {"X-Api-Key": api_key} if api_key else {}
        self._client = client or httpx.Client(base_url=self.BASE_URL, headers=headers, timeout=30.0)
        self._page_size = page_size
        self._max_retries = max_retries
        self._backoff_base = backoff_base

    def _get(self, path, params=None):
        last_exc = None
        for attempt in range(self._max_retries):
            try:
                resp = self._client.get(path, params=params)
            except httpx.HTTPError as exc:
                last_exc = exc
            else:
                if resp.status_code == 200:
                    return resp.json()
                err = PokemonTcgError(
                    f"HTTP {resp.status_code} for {path}", status_code=resp.status_code
                )
                if resp.status_code != 429 and resp.status_code < 500:
                    raise err
                last_exc = err
            if attempt < self._max_retries - 1:
                time.sleep(self._backoff_base * (2 ** attempt))
        raise PokemonTcgError(
            f"giving up on {path}", status_code=getattr(last_exc, "status_code", None)
        ) from last_exc

    def iter_all_cards(self) -> Iterator[dict]:
        page = 1
        while True:
            data = self._get("/cards", params={"page": page, "pageSize": self._page_size})
            cards = data.get("data", [])
            if not cards:
                return
            yield from cards
            if len(cards) < self._page_size:
                return
            page += 1

    def get_card(self, card_id) -> dict | None:
        try:
            data = self._get(f"/cards/{card_id}")
        except PokemonTcgError as exc:
            if exc.status_code == 404:
                return None
            raise
        return data.get("data")
