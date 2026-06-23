# Backend Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend data-model layer for Merlin's Minty Cards — DynamoDB single-table persistence for the Pokémon card catalog, price history, and company inventory (raw + graded), plus the PokemonTCG.io client and an idempotent daily catalog/price sync.

**Architecture:** One DynamoDB table (`merlins-cards`) with entity-prefixed keys and one GSI. Pydantic v2 domain models; a pure-persistence repository (`InventoryRepository`) that owns all `Decimal`/key serialization and sharding; a thin `httpx` PokemonTCG.io client + pure mapper; and `catalog_sync` orchestration functions invoked daily by a (later) scheduler. Inventory is sharded across 10 partitions and all reads paginate.

**Tech Stack:** Python 3.12+, Pydantic v2, boto3 (DynamoDB resource), httpx, pytest, moto (`@mock_aws`).

## Global Constraints

- **Outside-in TDD, strictly phased:** RED (write failing test, do NOT implement) → confirm it fails for the right reason → GREEN (minimal code) → REFACTOR. Never combine phases.
- **Money & grades are `Decimal` end-to-end.** No `float` ever reaches DynamoDB; convert via `Decimal(str(x))`.
- **Tests are hermetic:** DynamoDB via `moto` `@mock_aws`; HTTP via `httpx.MockTransport`. No real network, no Docker.
- **Single table** `merlins-cards`: `PK`/`SK` + GSI `GSI1` (`GSI1PK`/`GSI1SK`), billing `PAY_PER_REQUEST`.
- **Inventory sharding:** `INVENTORY_SHARD_COUNT = 10`; shard = stable digest of `card_id` (`md5`), **never** Python's built-in `hash()`.
- **Every multi-item read paginates** on `LastEvaluatedKey`.
- **Run tests:** `python -m pytest backend/tests -q --tb=short` · **Lint:** `ruff check backend/src`
- **Commit message trailer:** end every commit body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Spec of record: `docs/superpowers/specs/2026-06-22-backend-data-model-design.md`.

---

## File structure

| File | Responsibility |
|---|---|
| `backend/src/merlins_collection/config.py` | add `pokemontcg_api_key` setting |
| `backend/src/merlins_collection/models/catalog.py` | `CardImages`, `FinishPrice`, `CatalogCard`, `PricePoint` |
| `backend/src/merlins_collection/models/inventory.py` | `Condition`, `GradingCompany`, `RawInventoryItem`, `GradedInventoryItem`, `InventoryItem`, `InventoryItemAdapter` |
| `backend/src/merlins_collection/services/dynamodb.py` | `InventoryRepository`, `_bucket`, `_serialize`, `INVENTORY_SHARD_COUNT` |
| `backend/src/merlins_collection/services/pokemontcg.py` | `PokemonTcgClient`, `to_catalog_card`, `PokemonTcgError` |
| `backend/src/merlins_collection/services/catalog_sync.py` | `sync_catalog`, `snapshot_graded_prices`, `refresh_inventory_market_values`, `run_daily_sync` |
| `backend/tests/conftest.py` | add `dynamo_repo` moto fixture |
| `backend/tests/test_config.py` | config test |
| `backend/tests/models/test_catalog.py`, `test_inventory.py` | model tests |
| `backend/tests/services/test_dynamodb.py` | repository tests |
| `backend/tests/services/test_pokemontcg.py` | client + mapper tests |
| `backend/tests/services/test_catalog_sync.py` | sync orchestration tests |

---

## Task 1: Dependencies & config

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/src/merlins_collection/config.py`
- Modify: `backend/.env.example`
- Test: `backend/tests/test_config.py`

**Interfaces:**
- Produces: `merlins_collection.config.Settings.pokemontcg_api_key: str` (env `POKEMONTCG_API_KEY`, default `""`).

- [ ] **Step 1: Move `httpx` to runtime deps and add `moto` to dev deps in `backend/pyproject.toml`**

Change the `dependencies` and `dev` lists to:

```toml
dependencies = [
    "fastapi>=0.111.0",
    "uvicorn[standard]>=0.30.0",
    "boto3>=1.34.0",
    "pydantic-settings>=2.3.0",
    "python-jose[cryptography]>=3.3.0",
    "httpx>=0.27.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "moto>=5.0.0",
    "ruff>=0.4.0",
]
```

- [ ] **Step 2: Install the updated dependencies**

Run: `cd backend && pip install -e ".[dev]"`
Expected: installs `moto`; finishes with "Successfully installed ... moto-5.x".

- [ ] **Step 3: Write the failing test**

Create `backend/tests/test_config.py`:

```python
def test_settings_reads_pokemontcg_api_key(monkeypatch):
    monkeypatch.setenv("POKEMONTCG_API_KEY", "abc123")
    from merlins_collection.config import Settings

    assert Settings().pokemontcg_api_key == "abc123"
```

- [ ] **Step 4: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_config.py -v`
Expected: FAIL — `AttributeError: 'Settings' object has no attribute 'pokemontcg_api_key'`.

- [ ] **Step 5: Add the setting**

In `backend/src/merlins_collection/config.py`, add inside `Settings` (after `bedrock_model_id`):

```python
    pokemontcg_api_key: str = ""
```

- [ ] **Step 6: Add the env var to `backend/.env.example`**

Append:

```
POKEMONTCG_API_KEY=
```

- [ ] **Step 7: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_config.py -v`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/pyproject.toml backend/src/merlins_collection/config.py backend/.env.example backend/tests/test_config.py
git commit -m "feat(backend): add POKEMONTCG_API_KEY setting; httpx runtime + moto dev deps"
```

---

## Task 2: Catalog domain models

**Files:**
- Create: `backend/src/merlins_collection/models/catalog.py`
- Create: `backend/tests/models/__init__.py`
- Test: `backend/tests/models/test_catalog.py`

**Interfaces:**
- Produces:
  - `CardImages(small: str, large: str)`
  - `FinishPrice(market|low|mid|high: Decimal | None)`
  - `CatalogCard(card_id, name, set_id, set_name, number: str; rarity: str|None; types: list[str]; images: CardImages; prices: dict[str, FinishPrice]; last_synced_at: datetime)`
  - `PricePoint(card_id: str; date: date; source: str; kind: Literal["raw","graded"]; finish|company: str|None; grade|market|low|mid|high: Decimal|None)`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/models/__init__.py` (empty), then `backend/tests/models/test_catalog.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/models/test_catalog.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'merlins_collection.models.catalog'`.

- [ ] **Step 3: Implement the models**

Create `backend/src/merlins_collection/models/catalog.py`:

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/models/test_catalog.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/merlins_collection/models/catalog.py backend/tests/models/__init__.py backend/tests/models/test_catalog.py
git commit -m "feat(backend): add catalog domain models (CatalogCard, FinishPrice, PricePoint)"
```

---

## Task 3: Inventory domain models

**Files:**
- Create: `backend/src/merlins_collection/models/inventory.py`
- Test: `backend/tests/models/test_inventory.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `Condition` (StrEnum: `NM LP MP HP DMG`), `GradingCompany` (StrEnum: `PSA BGS CGC SGC`)
  - `RawInventoryItem(kind="raw", card_id, quantity: int, listed_price, cost_basis: Decimal, current_market_value: Decimal|None, acquired_at: date, finish: str, condition: Condition)`
  - `GradedInventoryItem(kind="graded", … shared …, company: GradingCompany, grade: Decimal, cert_number: str)`
  - `InventoryItem` = discriminated union on `kind`
  - `InventoryItemAdapter: TypeAdapter[InventoryItem]` — use `.validate_python(dict)` to parse.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/models/test_inventory.py`:

```python
from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from merlins_collection.models.inventory import (
    Condition,
    GradedInventoryItem,
    InventoryItemAdapter,
    RawInventoryItem,
)


def test_raw_item_parses_via_adapter():
    item = InventoryItemAdapter.validate_python(
        {
            "kind": "raw",
            "card_id": "swsh1-1",
            "quantity": 3,
            "listed_price": Decimal("10"),
            "cost_basis": Decimal("4"),
            "acquired_at": date(2026, 1, 1),
            "finish": "holofoil",
            "condition": "NM",
        }
    )
    assert isinstance(item, RawInventoryItem)
    assert item.condition is Condition.NM
    assert item.current_market_value is None


def test_graded_item_parses_via_adapter():
    item = InventoryItemAdapter.validate_python(
        {
            "kind": "graded",
            "card_id": "swsh1-1",
            "quantity": 1,
            "listed_price": Decimal("600"),
            "cost_basis": Decimal("300"),
            "acquired_at": date(2026, 1, 1),
            "company": "PSA",
            "grade": Decimal("10"),
            "cert_number": "12345678",
        }
    )
    assert isinstance(item, GradedInventoryItem)
    assert item.grade == Decimal("10")


def test_raw_item_rejects_graded_fields_missing():
    with pytest.raises(ValidationError):
        RawInventoryItem(
            kind="raw", card_id="x", quantity=1,
            listed_price=Decimal("1"), cost_basis=Decimal("1"),
            acquired_at=date(2026, 1, 1),
            # missing finish + condition
        )
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/models/test_inventory.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'merlins_collection.models.inventory'`.

- [ ] **Step 3: Implement the models**

Create `backend/src/merlins_collection/models/inventory.py`:

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/models/test_inventory.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/merlins_collection/models/inventory.py backend/tests/models/test_inventory.py
git commit -m "feat(backend): add inventory domain models (raw/graded discriminated union)"
```

---

## Task 4: Repository — table, serialization, catalog & graded-price ops

**Files:**
- Create: `backend/src/merlins_collection/services/dynamodb.py`
- Modify: `backend/tests/conftest.py` (add `dynamo_repo` fixture)
- Test: `backend/tests/services/test_dynamodb.py`

**Interfaces:**
- Consumes: `CatalogCard` (Task 2); `GradingCompany` (Task 3).
- Produces:
  - `INVENTORY_SHARD_COUNT: int = 10`; `_bucket(card_id: str) -> int`
  - `InventoryRepository(table_name: str, *, endpoint_url: str | None = None, region_name: str = "us-east-1")`
  - `.create_table() -> None`
  - `.get_catalog_card(card_id) -> CatalogCard | None`
  - `.batch_upsert_catalog_cards(cards: list[CatalogCard]) -> None`
  - `.list_cards_by_set(set_id: str) -> list[CatalogCard]`
  - `.set_graded_market_value(card_id, company, grade, value: Decimal) -> None`
  - `.get_graded_market_value(card_id, company, grade) -> Decimal | None`

- [ ] **Step 1: Add the `dynamo_repo` fixture to `backend/tests/conftest.py`**

Add `import os` to the top of `backend/tests/conftest.py` (it already imports `pytest`), then append the fixture:

```python
@pytest.fixture
def dynamo_repo():
    from moto import mock_aws

    with mock_aws():
        os.environ["AWS_ACCESS_KEY_ID"] = "testing"
        os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
        os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
        from merlins_collection.services.dynamodb import InventoryRepository

        repo = InventoryRepository("merlins-cards-test", region_name="us-east-1")
        repo.create_table()
        yield repo
```

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/services/test_dynamodb.py`:

```python
from datetime import datetime
from decimal import Decimal

from merlins_collection.models.catalog import CatalogCard


def _card(card_id="swsh1-1", set_id="swsh1", market="12.50"):
    return CatalogCard(
        card_id=card_id, name="Celebi V", set_id=set_id, set_name="S&S",
        number="1", images={"small": "s", "large": "l"},
        prices={"holofoil": {"market": Decimal(market)}},
        last_synced_at=datetime(2026, 6, 22, 12, 0, 0),
    )


def test_upsert_then_get_catalog_card(dynamo_repo):
    dynamo_repo.batch_upsert_catalog_cards([_card()])
    got = dynamo_repo.get_catalog_card("swsh1-1")
    assert got is not None
    assert got.name == "Celebi V"
    assert got.prices["holofoil"].market == Decimal("12.50")


def test_get_missing_card_returns_none(dynamo_repo):
    assert dynamo_repo.get_catalog_card("nope") is None


def test_list_cards_by_set(dynamo_repo):
    dynamo_repo.batch_upsert_catalog_cards([_card("a-1", "setA"), _card("a-2", "setA"), _card("b-1", "setB")])
    cards = dynamo_repo.list_cards_by_set("setA")
    assert {c.card_id for c in cards} == {"a-1", "a-2"}


def test_batch_upsert_handles_more_than_25(dynamo_repo):
    cards = [_card(f"big-{i}", "setBig") for i in range(30)]
    dynamo_repo.batch_upsert_catalog_cards(cards)
    assert len(dynamo_repo.list_cards_by_set("setBig")) == 30


def test_graded_price_set_and_get(dynamo_repo):
    from merlins_collection.models.inventory import GradingCompany

    dynamo_repo.set_graded_market_value("swsh1-1", GradingCompany.PSA, Decimal("10"), Decimal("500"))
    assert dynamo_repo.get_graded_market_value("swsh1-1", GradingCompany.PSA, Decimal("10")) == Decimal("500")


def test_catalog_upsert_does_not_clobber_graded_price(dynamo_repo):
    from merlins_collection.models.inventory import GradingCompany

    dynamo_repo.set_graded_market_value("swsh1-1", GradingCompany.PSA, Decimal("10"), Decimal("500"))
    dynamo_repo.batch_upsert_catalog_cards([_card()])  # re-sync the same card
    assert dynamo_repo.get_graded_market_value("swsh1-1", GradingCompany.PSA, Decimal("10")) == Decimal("500")
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_dynamodb.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'merlins_collection.services.dynamodb'` (the `dynamo_repo` fixture import fails).

- [ ] **Step 4: Implement the repository (table + serialization + catalog + graded ops)**

Create `backend/src/merlins_collection/services/dynamodb.py`:

```python
from __future__ import annotations

import hashlib
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

import boto3
from boto3.dynamodb.conditions import Key

from merlins_collection.models.catalog import CatalogCard

INVENTORY_SHARD_COUNT = 10


def _bucket(card_id: str) -> int:
    # Stable across processes — never use builtin hash() (salted by PYTHONHASHSEED).
    digest = hashlib.md5(card_id.encode("utf-8")).hexdigest()
    return int(digest, 16) % INVENTORY_SHARD_COUNT


def _serialize(value):
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize(v) for v in value]
    return value


class InventoryRepository:
    def __init__(self, table_name, *, endpoint_url=None, region_name="us-east-1"):
        self._resource = boto3.resource(
            "dynamodb", endpoint_url=endpoint_url, region_name=region_name
        )
        self._table_name = table_name
        self._table = self._resource.Table(table_name)

    # ---- table management (tests / local dev; prod table is provisioned by infra) ----
    def create_table(self):
        self._resource.create_table(
            TableName=self._table_name,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
        )
        self._table.wait_until_exists()

    # ---- internal helpers ----
    def _query_all(self, **kwargs):
        items = []
        while True:
            resp = self._table.query(**kwargs)
            items.extend(resp.get("Items", []))
            last = resp.get("LastEvaluatedKey")
            if not last:
                return items
            kwargs["ExclusiveStartKey"] = last

    def _catalog_item(self, card: CatalogCard) -> dict:
        body = _serialize(card.model_dump(mode="python"))
        return {
            "PK": f"CARD#{card.card_id}",
            "SK": "META",
            "GSI1PK": f"SET#{card.set_id}",
            "GSI1SK": f"CARD#{card.card_id}",
            "entity": "catalog_card",
            **body,
        }

    # ---- catalog ----
    def get_catalog_card(self, card_id):
        item = self._table.get_item(Key={"PK": f"CARD#{card_id}", "SK": "META"}).get("Item")
        return CatalogCard.model_validate(item) if item else None

    def batch_upsert_catalog_cards(self, cards):
        with self._table.batch_writer() as batch:  # auto-chunks to 25 + retries unprocessed
            for card in cards:
                batch.put_item(Item=self._catalog_item(card))

    def list_cards_by_set(self, set_id):
        items = self._query_all(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"SET#{set_id}")
            & Key("GSI1SK").begins_with("CARD#"),
        )
        return [CatalogCard.model_validate(i) for i in items]

    # ---- graded current price (separate item; catalog put never touches it) ----
    def set_graded_market_value(self, card_id, company, grade, value: Decimal):
        self._table.put_item(
            Item={
                "PK": f"CARD#{card_id}",
                "SK": f"GRADEDPRICE#{company}#{grade}",
                "entity": "graded_price",
                "card_id": card_id,
                "company": _serialize(company),
                "grade": grade,
                "market_value": value,
                "source": "manual",
                "updated_at": datetime.utcnow().isoformat(),
            }
        )

    def get_graded_market_value(self, card_id, company, grade):
        item = self._table.get_item(
            Key={"PK": f"CARD#{card_id}", "SK": f"GRADEDPRICE#{company}#{grade}"}
        ).get("Item")
        return item["market_value"] if item else None
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_dynamodb.py -v`
Expected: PASS (6 passed).

- [ ] **Step 6: Commit**

```bash
git add backend/src/merlins_collection/services/dynamodb.py backend/tests/conftest.py backend/tests/services/test_dynamodb.py
git commit -m "feat(backend): repository table setup + catalog and graded-price ops"
```

---

## Task 5: Repository — price history ops

**Files:**
- Modify: `backend/src/merlins_collection/services/dynamodb.py`
- Test: `backend/tests/services/test_dynamodb.py` (add)

**Interfaces:**
- Consumes: `PricePoint` (Task 2).
- Produces:
  - `.append_price_points(points: list[PricePoint]) -> None`
  - `.get_price_history(card_id, *, finish=None, company=None, grade=None, start: date|None=None, end: date|None=None) -> list[PricePoint]`

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/services/test_dynamodb.py`:

```python
from datetime import date as _date

from merlins_collection.models.catalog import PricePoint


def _raw_point(card_id, d, market):
    return PricePoint(card_id=card_id, date=d, source="pokemontcg.io",
                      kind="raw", finish="holofoil", market=Decimal(market))


def test_price_history_range_for_finish(dynamo_repo):
    dynamo_repo.append_price_points([
        _raw_point("c1", _date(2026, 6, 20), "10"),
        _raw_point("c1", _date(2026, 6, 21), "11"),
        _raw_point("c1", _date(2026, 6, 22), "12"),
    ])
    got = dynamo_repo.get_price_history(
        "c1", finish="holofoil", start=_date(2026, 6, 21), end=_date(2026, 6, 22)
    )
    assert [p.date for p in got] == [_date(2026, 6, 21), _date(2026, 6, 22)]
    assert got[-1].market == Decimal("12")


def test_price_history_all_raw(dynamo_repo):
    dynamo_repo.append_price_points([_raw_point("c2", _date(2026, 6, 20), "5")])
    assert len(dynamo_repo.get_price_history("c2", finish="holofoil")) == 1


def test_query_pagination_follows_last_evaluated_key(dynamo_repo, monkeypatch):
    # Drive the LastEvaluatedKey loop deterministically (no need for >1MB of data).
    item1 = {"card_id": "c9", "date": "2026-06-20", "source": "x",
             "kind": "raw", "finish": "holofoil", "market": Decimal("1")}
    item2 = {"card_id": "c9", "date": "2026-06-21", "source": "x",
             "kind": "raw", "finish": "holofoil", "market": Decimal("2")}
    calls = []

    def fake_query(**kwargs):
        calls.append(kwargs)
        if "ExclusiveStartKey" not in kwargs:
            return {"Items": [item1], "LastEvaluatedKey": {"PK": "CARD#c9", "SK": "p"}}
        return {"Items": [item2]}

    monkeypatch.setattr(dynamo_repo._table, "query", fake_query)
    got = dynamo_repo.get_price_history("c9", finish="holofoil")
    assert len(got) == 2
    assert len(calls) == 2
    assert "ExclusiveStartKey" in calls[1]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_dynamodb.py::test_price_history_range_for_finish -v`
Expected: FAIL — `AttributeError: 'InventoryRepository' object has no attribute 'append_price_points'`.

- [ ] **Step 3: Implement price ops**

Update the existing catalog import in `backend/src/merlins_collection/services/dynamodb.py` to `from merlins_collection.models.catalog import CatalogCard, PricePoint`, then add these methods to `InventoryRepository`:

```python
    def _price_point_item(self, p: PricePoint) -> dict:
        if p.kind == "raw":
            sk = f"PRICE#RAW#{p.finish}#{p.date.isoformat()}"
        else:
            sk = f"PRICE#GRADED#{p.company}#{p.grade}#{p.date.isoformat()}"
        body = _serialize(p.model_dump(mode="python"))
        return {"PK": f"CARD#{p.card_id}", "SK": sk, "entity": "price_point", **body}

    def append_price_points(self, points):
        with self._table.batch_writer() as batch:
            for p in points:
                batch.put_item(Item=self._price_point_item(p))

    def get_price_history(self, card_id, *, finish=None, company=None,
                          grade=None, start=None, end=None):
        if company is not None:
            prefix = f"PRICE#GRADED#{company}#{grade}#" if grade is not None else f"PRICE#GRADED#{company}#"
        elif finish is not None:
            prefix = f"PRICE#RAW#{finish}#"
        else:
            prefix = "PRICE#RAW#"
        pk = Key("PK").eq(f"CARD#{card_id}")
        if start is not None and end is not None:
            cond = pk & Key("SK").between(f"{prefix}{start.isoformat()}", f"{prefix}{end.isoformat()}")
        else:
            cond = pk & Key("SK").begins_with(prefix)
        items = self._query_all(KeyConditionExpression=cond)
        return [PricePoint.model_validate(i) for i in items]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_dynamodb.py -v`
Expected: PASS (9 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/merlins_collection/services/dynamodb.py backend/tests/services/test_dynamodb.py
git commit -m "feat(backend): repository price-history append + range query"
```

---

## Task 6: Repository — inventory ops (sharding + pagination)

**Files:**
- Modify: `backend/src/merlins_collection/services/dynamodb.py`
- Test: `backend/tests/services/test_dynamodb.py` (add)

**Interfaces:**
- Consumes: `InventoryItem`, `InventoryItemAdapter` (Task 3).
- Produces:
  - `.put_inventory_item(item: InventoryItem) -> None`
  - `.get_inventory_item(item: InventoryItem) -> InventoryItem | None`
  - `.delete_inventory_item(item: InventoryItem) -> None`
  - `.list_inventory() -> list[InventoryItem]` (scatter-gather across all shards, paginated)
  - `.list_inventory_for_card(card_id: str) -> list[InventoryItem]` (GSI1)

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/services/test_dynamodb.py`:

```python
from merlins_collection.models.inventory import (
    Condition, GradingCompany, RawInventoryItem, GradedInventoryItem,
)
from merlins_collection.services.dynamodb import INVENTORY_SHARD_COUNT, _bucket


def _raw_item(card_id="swsh1-1", finish="holofoil", condition="NM", qty=1):
    return RawInventoryItem(
        card_id=card_id, quantity=qty, listed_price=Decimal("10"),
        cost_basis=Decimal("4"), acquired_at=_date(2026, 1, 1),
        finish=finish, condition=Condition(condition),
    )


def test_bucket_is_stable_and_in_range():
    assert _bucket("swsh1-1") == _bucket("swsh1-1")
    assert 0 <= _bucket("swsh1-1") < INVENTORY_SHARD_COUNT


def test_put_then_get_inventory_item(dynamo_repo):
    item = _raw_item()
    dynamo_repo.put_inventory_item(item)
    assert dynamo_repo.get_inventory_item(item) == item


def test_delete_inventory_item(dynamo_repo):
    item = _raw_item()
    dynamo_repo.put_inventory_item(item)
    dynamo_repo.delete_inventory_item(item)
    assert dynamo_repo.get_inventory_item(item) is None


def test_list_inventory_gathers_across_shards(dynamo_repo):
    # card_ids chosen so they land in different buckets in a real run; the count is what matters
    items = [_raw_item(card_id=f"card-{i}") for i in range(25)]
    for it in items:
        dynamo_repo.put_inventory_item(it)
    listed = dynamo_repo.list_inventory()
    assert len(listed) == 25
    assert {i.card_id for i in listed} == {f"card-{i}" for i in range(25)}


def test_list_inventory_for_card(dynamo_repo):
    dynamo_repo.put_inventory_item(_raw_item(condition="NM"))
    dynamo_repo.put_inventory_item(_raw_item(condition="LP"))
    dynamo_repo.put_inventory_item(_raw_item(card_id="other"))
    rows = dynamo_repo.list_inventory_for_card("swsh1-1")
    assert len(rows) == 2
    assert {r.condition for r in rows} == {Condition.NM, Condition.LP}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_dynamodb.py::test_put_then_get_inventory_item -v`
Expected: FAIL — `AttributeError: 'InventoryRepository' object has no attribute 'put_inventory_item'`.

- [ ] **Step 3: Implement inventory ops**

Add to the imports in `dynamodb.py`:

```python
from merlins_collection.models.inventory import InventoryItemAdapter
```

Add these methods to `InventoryRepository`:

```python
    def _inventory_keys(self, item) -> tuple[str, str, str]:
        pk = f"INV#{_bucket(item.card_id)}"
        if item.kind == "raw":
            sk = f"CARD#{item.card_id}#RAW#{item.finish}#{item.condition}"
            gsi1sk = f"INV#RAW#{item.finish}#{item.condition}"
        else:
            sk = f"CARD#{item.card_id}#GRADED#{item.company}#{item.grade}#{item.cert_number}"
            gsi1sk = f"INV#GRADED#{item.company}#{item.grade}"
        return pk, sk, gsi1sk

    def put_inventory_item(self, item):
        pk, sk, gsi1sk = self._inventory_keys(item)
        body = _serialize(item.model_dump(mode="python"))
        self._table.put_item(
            Item={
                "PK": pk, "SK": sk,
                "GSI1PK": f"CARD#{item.card_id}", "GSI1SK": gsi1sk,
                "entity": "inventory_item", **body,
            }
        )

    def get_inventory_item(self, item):
        pk, sk, _ = self._inventory_keys(item)
        found = self._table.get_item(Key={"PK": pk, "SK": sk}).get("Item")
        return InventoryItemAdapter.validate_python(found) if found else None

    def delete_inventory_item(self, item):
        pk, sk, _ = self._inventory_keys(item)
        self._table.delete_item(Key={"PK": pk, "SK": sk})

    def list_inventory(self):
        items = []
        for bucket in range(INVENTORY_SHARD_COUNT):
            items.extend(self._query_all(KeyConditionExpression=Key("PK").eq(f"INV#{bucket}")))
        return [InventoryItemAdapter.validate_python(i) for i in items]

    def list_inventory_for_card(self, card_id):
        items = self._query_all(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(f"CARD#{card_id}")
            & Key("GSI1SK").begins_with("INV#"),
        )
        return [InventoryItemAdapter.validate_python(i) for i in items]
```

> Note: `list_inventory` does a **sequential** scatter-gather across the 10 shards. True parallelism (thread pool) is deferred — boto3 *resources* are not guaranteed thread-safe to share across threads, and 10 small sequential queries are fine at this scale. The sharding (no single hot partition) and pagination guarantees still hold.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_dynamodb.py -v`
Expected: PASS (14 passed).

- [ ] **Step 5: Refactor check + full repo suite + lint**

Run: `python -m pytest backend/tests/services/test_dynamodb.py -q && ruff check backend/src/merlins_collection/services/dynamodb.py`
Expected: all pass; ruff reports "All checks passed!".

- [ ] **Step 6: Commit**

```bash
git add backend/src/merlins_collection/services/dynamodb.py backend/tests/services/test_dynamodb.py
git commit -m "feat(backend): repository inventory ops with sharding + pagination"
```

---

## Task 7: PokemonTCG.io mapper

**Files:**
- Create: `backend/src/merlins_collection/services/pokemontcg.py`
- Test: `backend/tests/services/test_pokemontcg.py`

**Interfaces:**
- Consumes: `CatalogCard`, `CardImages`, `FinishPrice` (Task 2).
- Produces: `to_catalog_card(raw: dict, *, synced_at: datetime | None = None) -> CatalogCard`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/services/test_pokemontcg.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_pokemontcg.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'merlins_collection.services.pokemontcg'`.

- [ ] **Step 3: Implement the mapper**

Create `backend/src/merlins_collection/services/pokemontcg.py`:

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_pokemontcg.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/merlins_collection/services/pokemontcg.py backend/tests/services/test_pokemontcg.py
git commit -m "feat(backend): PokemonTCG.io -> CatalogCard mapper"
```

---

## Task 8: PokemonTCG.io HTTP client

**Files:**
- Modify: `backend/src/merlins_collection/services/pokemontcg.py`
- Test: `backend/tests/services/test_pokemontcg.py` (add)

**Interfaces:**
- Produces:
  - `PokemonTcgError(RuntimeError)` with `.status_code: int | None`
  - `PokemonTcgClient(api_key: str = "", *, client: httpx.Client | None = None, page_size: int = 250, max_retries: int = 3, backoff_base: float = 0.5)`
  - `.iter_all_cards() -> Iterator[dict]`
  - `.get_card(card_id: str) -> dict | None`

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/services/test_pokemontcg.py`:

```python
import httpx

from merlins_collection.services.pokemontcg import PokemonTcgClient, PokemonTcgError


def _client(handler, **kwargs):
    transport = httpx.MockTransport(handler)
    http = httpx.Client(transport=transport, base_url=PokemonTcgClient.BASE_URL)
    return PokemonTcgClient(client=http, backoff_base=0, **kwargs)


def test_iter_all_cards_paginates():
    def handler(request):
        page = int(request.url.params["page"])
        bodies = {1: {"data": [{"id": "x1"}, {"id": "x2"}]}, 2: {"data": [{"id": "x3"}]}}
        return httpx.Response(200, json=bodies.get(page, {"data": []}))

    ids = [c["id"] for c in _client(handler, page_size=2).iter_all_cards()]
    assert ids == ["x1", "x2", "x3"]


def test_get_card_retries_on_5xx():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(503, json={})
        return httpx.Response(200, json={"data": {"id": "z"}})

    assert _client(handler, max_retries=3).get_card("z") == {"id": "z"}
    assert calls["n"] == 2


def test_get_card_404_returns_none():
    assert _client(lambda r: httpx.Response(404, json={})).get_card("nope") is None


def test_get_card_4xx_raises():
    import pytest

    with pytest.raises(PokemonTcgError):
        _client(lambda r: httpx.Response(400, json={})).get_card("bad")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_pokemontcg.py::test_iter_all_cards_paginates -v`
Expected: FAIL — `ImportError: cannot import name 'PokemonTcgClient'`.

- [ ] **Step 3: Implement the client**

Add to the top of `backend/src/merlins_collection/services/pokemontcg.py`:

```python
import time
from collections.abc import Iterator

import httpx
```

Append to the same file:

```python
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
                err = PokemonTcgError(f"HTTP {resp.status_code} for {path}", status_code=resp.status_code)
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_pokemontcg.py -v`
Expected: PASS (6 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/merlins_collection/services/pokemontcg.py backend/tests/services/test_pokemontcg.py
git commit -m "feat(backend): PokemonTCG.io HTTP client with pagination + retry"
```

---

## Task 9: Catalog sync — `sync_catalog` (+ idempotency)

**Files:**
- Create: `backend/src/merlins_collection/services/catalog_sync.py`
- Test: `backend/tests/services/test_catalog_sync.py`

**Interfaces:**
- Consumes: `InventoryRepository` (Tasks 4-6); `to_catalog_card` (Task 7); `PricePoint` (Task 2).
- Produces: `sync_catalog(repo, client, today: date, *, batch_size: int = 500) -> dict` with keys `cards_synced`, `price_points_written`, `failures`. `client` only needs `.iter_all_cards()`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/services/test_catalog_sync.py`:

```python
from datetime import date
from decimal import Decimal

from merlins_collection.services.catalog_sync import sync_catalog

RAW = {
    "id": "swsh1-1", "name": "Celebi V", "number": "1",
    "set": {"id": "swsh1", "name": "S&S"},
    "images": {"small": "s", "large": "l"},
    "tcgplayer": {"prices": {"holofoil": {"market": 9.25}}},
}


class FakeClient:
    def __init__(self, cards):
        self._cards = cards

    def iter_all_cards(self):
        yield from self._cards


def test_sync_catalog_upserts_card_and_price_point(dynamo_repo):
    summary = sync_catalog(dynamo_repo, FakeClient([RAW]), date(2026, 6, 22))
    assert summary == {"cards_synced": 1, "price_points_written": 1, "failures": 0}
    assert dynamo_repo.get_catalog_card("swsh1-1").prices["holofoil"].market == Decimal("9.25")
    history = dynamo_repo.get_price_history("swsh1-1", finish="holofoil")
    assert [p.date for p in history] == [date(2026, 6, 22)]


def test_sync_catalog_is_idempotent_for_same_day(dynamo_repo):
    sync_catalog(dynamo_repo, FakeClient([RAW]), date(2026, 6, 22))
    sync_catalog(dynamo_repo, FakeClient([RAW]), date(2026, 6, 22))
    assert len(dynamo_repo.get_price_history("swsh1-1", finish="holofoil")) == 1


def test_sync_catalog_skips_bad_cards(dynamo_repo):
    summary = sync_catalog(dynamo_repo, FakeClient([{"bad": "no id"}, RAW]), date(2026, 6, 22))
    assert summary["failures"] == 1
    assert summary["cards_synced"] == 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_catalog_sync.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'merlins_collection.services.catalog_sync'`.

- [ ] **Step 3: Implement `sync_catalog`**

Create `backend/src/merlins_collection/services/catalog_sync.py`:

```python
from __future__ import annotations

from datetime import date

from merlins_collection.models.catalog import PricePoint
from merlins_collection.services.pokemontcg import to_catalog_card


def sync_catalog(repo, client, today: date, *, batch_size: int = 500) -> dict:
    cards: list = []
    points: list = []
    cards_synced = 0
    points_written = 0
    failures = 0

    def flush_cards():
        nonlocal cards
        if cards:
            repo.batch_upsert_catalog_cards(cards)
            cards = []

    def flush_points():
        nonlocal points, points_written
        if points:
            repo.append_price_points(points)
            points_written += len(points)
            points = []

    for raw in client.iter_all_cards():
        try:
            card = to_catalog_card(raw)
        except Exception:
            failures += 1
            continue
        cards.append(card)
        cards_synced += 1
        for finish, fp in card.prices.items():
            points.append(
                PricePoint(
                    card_id=card.card_id, date=today, source="pokemontcg.io",
                    kind="raw", finish=finish,
                    market=fp.market, low=fp.low, mid=fp.mid, high=fp.high,
                )
            )
        if len(cards) >= batch_size:
            flush_cards()
        if len(points) >= batch_size:
            flush_points()

    flush_cards()
    flush_points()
    return {"cards_synced": cards_synced, "price_points_written": points_written, "failures": failures}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_catalog_sync.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/merlins_collection/services/catalog_sync.py backend/tests/services/test_catalog_sync.py
git commit -m "feat(backend): sync_catalog (idempotent upsert + raw price points)"
```

---

## Task 10: Catalog sync — graded snapshot, value refresh, daily orchestration

**Files:**
- Modify: `backend/src/merlins_collection/services/catalog_sync.py`
- Test: `backend/tests/services/test_catalog_sync.py` (add)

**Interfaces:**
- Consumes: repository inventory + graded-price + catalog methods.
- Produces:
  - `snapshot_graded_prices(repo, today: date) -> dict` (key `graded_points_written`)
  - `refresh_inventory_market_values(repo) -> int`
  - `run_daily_sync(repo, client, today: date) -> dict` (merged summary incl. `items_refreshed`)

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/services/test_catalog_sync.py`:

```python
from merlins_collection.models.inventory import (
    Condition, GradingCompany, GradedInventoryItem, RawInventoryItem,
)
from merlins_collection.services.catalog_sync import (
    refresh_inventory_market_values, run_daily_sync, snapshot_graded_prices,
)


def _raw_item(card_id="swsh1-1"):
    return RawInventoryItem(
        card_id=card_id, quantity=2, listed_price=Decimal("10"),
        cost_basis=Decimal("4"), acquired_at=date(2026, 1, 1),
        finish="holofoil", condition=Condition.NM,
    )


def _graded_item(card_id="swsh1-1"):
    return GradedInventoryItem(
        card_id=card_id, quantity=1, listed_price=Decimal("700"),
        cost_basis=Decimal("300"), acquired_at=date(2026, 1, 1),
        company=GradingCompany.PSA, grade=Decimal("10"), cert_number="123",
    )


def test_refresh_sets_current_market_value_from_catalog(dynamo_repo):
    sync_catalog(dynamo_repo, FakeClient([RAW]), date(2026, 6, 22))
    dynamo_repo.put_inventory_item(_raw_item())
    updated = refresh_inventory_market_values(dynamo_repo)
    assert updated == 1
    assert dynamo_repo.get_inventory_item(_raw_item()).current_market_value == Decimal("9.25")


def test_snapshot_graded_prices_writes_history_for_owned_slabs(dynamo_repo):
    dynamo_repo.set_graded_market_value("swsh1-1", GradingCompany.PSA, Decimal("10"), Decimal("500"))
    dynamo_repo.put_inventory_item(_graded_item())
    summary = snapshot_graded_prices(dynamo_repo, date(2026, 6, 22))
    assert summary == {"graded_points_written": 1}
    hist = dynamo_repo.get_price_history("swsh1-1", company=GradingCompany.PSA, grade=Decimal("10"))
    assert hist[0].market == Decimal("500")


def test_run_daily_sync_combines_steps(dynamo_repo):
    dynamo_repo.put_inventory_item(_raw_item())
    summary = run_daily_sync(dynamo_repo, FakeClient([RAW]), date(2026, 6, 22))
    assert summary["cards_synced"] == 1
    assert summary["items_refreshed"] == 1
    assert dynamo_repo.get_inventory_item(_raw_item()).current_market_value == Decimal("9.25")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest backend/tests/services/test_catalog_sync.py::test_refresh_sets_current_market_value_from_catalog -v`
Expected: FAIL — `ImportError: cannot import name 'refresh_inventory_market_values'`.

- [ ] **Step 3: Implement the remaining sync functions**

Append to `backend/src/merlins_collection/services/catalog_sync.py`:

```python
def snapshot_graded_prices(repo, today: date) -> dict:
    seen = set()
    written = 0
    for item in repo.list_inventory():
        if item.kind != "graded":
            continue
        key = (item.card_id, item.company, item.grade)
        if key in seen:
            continue
        seen.add(key)
        value = repo.get_graded_market_value(item.card_id, item.company, item.grade)
        if value is None:
            continue
        repo.append_price_points(
            [
                PricePoint(
                    card_id=item.card_id, date=today, source="manual",
                    kind="graded", company=item.company, grade=item.grade, market=value,
                )
            ]
        )
        written += 1
    return {"graded_points_written": written}


def refresh_inventory_market_values(repo) -> int:
    updated = 0
    catalog_cache: dict = {}
    graded_cache: dict = {}
    for item in repo.list_inventory():
        if item.kind == "raw":
            if item.card_id not in catalog_cache:
                catalog_cache[item.card_id] = repo.get_catalog_card(item.card_id)
            card = catalog_cache[item.card_id]
            finish_price = card.prices.get(item.finish) if card else None
            value = finish_price.market if finish_price else None
        else:
            ckey = (item.card_id, item.company, item.grade)
            if ckey not in graded_cache:
                graded_cache[ckey] = repo.get_graded_market_value(
                    item.card_id, item.company, item.grade
                )
            value = graded_cache[ckey]
        if value is not None and value != item.current_market_value:
            repo.put_inventory_item(item.model_copy(update={"current_market_value": value}))
            updated += 1
    return updated


def run_daily_sync(repo, client, today: date) -> dict:
    summary = sync_catalog(repo, client, today)
    summary.update(snapshot_graded_prices(repo, today))
    summary["items_refreshed"] = refresh_inventory_market_values(repo)
    return summary
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest backend/tests/services/test_catalog_sync.py -v`
Expected: PASS (6 passed).

- [ ] **Step 5: Run the full backend suite + lint**

Run: `python -m pytest backend/tests -q --tb=short && ruff check backend/src`
Expected: all tests pass; ruff "All checks passed!".

- [ ] **Step 6: Commit**

```bash
git add backend/src/merlins_collection/services/catalog_sync.py backend/tests/services/test_catalog_sync.py
git commit -m "feat(backend): graded snapshot, value refresh, run_daily_sync orchestration"
```

---

## Done — what this delivers

A complete, tested data-model layer: catalog + price-history + sharded inventory persistence, the PokemonTCG.io client, and an idempotent daily sync. Next backend slices (auth, filter-mode search, rate limiting, chat + MCP) build on `InventoryRepository` and the models defined here.

**Deferred (per spec §8):** automated graded feed; scheduler wiring for `run_daily_sync`; parallelizing the shard scatter-gather; consumer-side inventory cache; raising `INVENTORY_SHARD_COUNT`; OpenSearch.
