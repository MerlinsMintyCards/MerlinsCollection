# Merlin's Minty Cards — Backend Data Model Design

**Date:** 2026-06-22
**Status:** Approved (pending written-spec review)
**Slice:** First backend slice — the **data model**. This is the foundation every other backend subsystem depends on.

---

## 0. Context: where this fits

The backend decomposes into five fairly independent subsystems, to be specced and built one slice at a time:

1. Auth & identity (Cognito JWT validation, admin vs. customer roles)
2. Rate limiting / chat quota (per-user usage tracking, admin bypass)
3. **Data model & ingestion** ← *this spec*
4. Filter-mode search API (`GET /inventory/search`)
5. Chat-mode API + MCP tools (`POST /chat` → Bedrock → MCP tools + Knowledge Base)

Recommended build order: **Data model → Auth → Filter-mode → Rate limiting → MCP tools + Chat → Price-update scheduler.** Everything sits on top of the data model, so it goes first.

At the start of this work the entire backend is empty placeholders: bare `FastAPI` app, empty routers/services, empty `models/`. The MCP server's five tools have TypeScript type signatures but `throw "Not implemented"`. Nothing constrains the data model except the existing single-table config name (`merlins-cards`) and those type shapes.

---

## 1. Scope & assumptions

**In scope:**
- DynamoDB single-table schema
- Pydantic v2 domain models (`models/catalog.py`, `models/inventory.py`)
- Repository / persistence layer (`services/dynamodb.py`)
- PokemonTCG.io client (`services/pokemontcg.py`)
- Catalog/price **sync logic** (`services/catalog_sync.py`) — written as plain callables

**Out of scope (later slices):**
- The AWS scheduler that invokes the sync (EventBridge → Lambda, or container cron)
- Auth, the API routers, the MCP tools, the chat flow
- An automated graded-price feed (manual entry for now; automated feed is a fast-follow)
- Graded cards beyond raw-condition + manual valuation (e.g., per-population analytics)

**Assumptions / decisions:**

1. **Source of truth:** PokemonTCG.io API for the full catalog of all Pokémon cards *and* bundled TCGplayer (USD) market prices. (Chosen over TCGplayer-direct API and manual/CSV import for free, comprehensive coverage in one source.)
2. **Two datasets:** a **catalog** (all cards + market prices, mirrored into DynamoDB) and **company inventory** (the subset Merlin owns). Mirroring the full catalog (~20k cards) was chosen over inventory-only + live lookups, to keep all query paths inside DynamoDB and match the "DB contains all Pokémon cards" intent.
3. **Scale:** company inventory is in the **hundreds** (< ~1,000). This permits "list + filter in memory" for inventory search — no per-attribute indexes needed. Catalog is ~20k and synced in bulk via paged set queries.
4. **Single table** named `merlins-cards` (matches existing config), entity-prefixed keys, one GSI (set browsing + inventory-by-card).
5. **Refresh cadence:** daily. Each run appends one dated price point per card, so **price history accumulates from day one** (PokemonTCG.io only exposes a current snapshot; history must be captured by us or it's lost).
6. **Finish/printing is tracked.** TCGplayer prices are per finish (`normal`, `holofoil`, `reverseHolofoil`, `1stEditionHolofoil`, …). The catalog card stores the price map for all finishes; raw inventory records which finish it is, so the correct market price drives valuation/profit.
7. **Graded cards are in scope** with **manual valuation** for v1. PokemonTCG.io cannot price slabs, so an admin enters/maintains a graded market value per `(card, company, grade)`. The daily sync snapshots that manual value into history so graded trends still build. An automated graded feed (e.g., PriceCharting) is a planned fast-follow.
8. **Money & grades are `Decimal` end-to-end.** No float ever touches a price (DynamoDB rejects floats; float rounding must never corrupt money).
9. **Currency:** USD (TCGplayer).

---

## 2. DynamoDB single-table schema

**Table `merlins-cards`** — partition key `PK`, sort key `SK`, one global secondary index **GSI1** (`GSI1PK`, `GSI1SK`).

Graded market value is modeled **per `(card, company, grade)`** (a PSA 10 of a card is worth the same regardless of how many you own), so manual graded values live at the card level alongside raw per-finish prices. Each graded slab is just an ownership record (cost basis, listed price, cert #).

`current_market_value` is **denormalized onto each inventory item** and refreshed by the daily sync. This lets valuation / summary / filter-search run as a *single partition query* with no per-card lookups — the core "structured to optimize queries" win. Freshness is bounded by the daily sync, which is acceptable because prices themselves update daily.

| Entity | PK | SK | GSI1PK | GSI1SK | Key attributes |
|---|---|---|---|---|---|
| **Catalog card** | `CARD#<id>` | `META` | `SET#<setId>` | `CARD#<id>` | name, set_id, set_name, number, rarity, types[], images{small,large}, `prices` (finish → {market,low,mid,high}), `graded_prices` (`COMPANY#grade` → market value), last_synced_at |
| **Raw price point** | `CARD#<id>` | `PRICE#RAW#<finish>#<date>` | — | — | finish, date, market, low, mid, high, source |
| **Graded price point** | `CARD#<id>` | `PRICE#GRADED#<company>#<grade>#<date>` | — | — | company, grade, date, market_value, source=`manual` |
| **Inventory — raw** | `INV` | `CARD#<id>#RAW#<finish>#<condition>` | `CARD#<id>` | `INV#RAW#<finish>#<condition>` | card_id, finish, condition, quantity, listed_price, cost_basis, current_market_value, acquired_at |
| **Inventory — graded** | `INV` | `CARD#<id>#GRADED#<company>#<grade>#<cert>` | `CARD#<id>` | `INV#GRADED#<company>#<grade>` | card_id, company, grade, cert_number, quantity=1, listed_price, cost_basis, current_market_value, acquired_at |

**Access-pattern coverage:**

| # | Access pattern | Query |
|---|---|---|
| 1 | Card by ID (market price / trade-target lookup) | `PK=CARD#<id>, SK=META` — point read |
| 2 | Browse catalog by set | GSI1 `PK=SET#<setId>` (rarity filtered in app; sets are small) |
| 3 | List entire inventory (summary, valuation, filter search, trade math) | `PK=INV` — one query, hundreds of items |
| 4 | Inventory rows for a given card (all conditions/grades) | GSI1 `PK=CARD#<id>, SK begins_with INV#` |
| 5 | Price history for a card over a date range | `PK=CARD#<id>, SK between PRICE#RAW#<finish>#<start>..<end>` (or `begins_with PRICE#RAW#` for all finishes; `PRICE#GRADED#…` for graded) |
| 6 | Daily sync: upsert cards + append price points | `BatchWriteItem` (chunked to 25) |

Price-point items carry **no** GSI1 keys, so they stay out of GSI1 — the index holds only catalog-by-set and inventory-by-card, keeping it small. Filter-mode search needs **no extra index**: list inventory (pattern 3) and filter in memory.

**Enums / value domains:**
- `condition`: `NM | LP | MP | HP | DMG`
- `grading_company`: `PSA | BGS | CGC | SGC`
- `grade`: `Decimal` (whole and half grades, e.g. `10`, `9.5`)
- `finish`: whatever keys PokemonTCG.io returns (`normal`, `holofoil`, `reverseHolofoil`, `1stEditionHolofoil`, …)

**Scaling caveat (not built now):** the single `INV` partition is fine for hundreds–low-thousands of items. If inventory ever reaches tens of thousands, shard it (`INV#<bucket>`).

---

## 3. Domain models & repository interface

Pydantic v2. All money/grades are `Decimal`.

**`models/catalog.py`**
```python
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
    prices: dict[str, FinishPrice] = {}        # finish -> raw price (PokemonTCG.io)
    graded_prices: dict[str, Decimal] = {}     # "PSA#10" -> manual market value
    last_synced_at: datetime

class PricePoint(BaseModel):                    # one dated history row
    card_id: str
    date: date
    source: str
    kind: Literal["raw", "graded"]
    finish: str | None = None                  # raw only
    company: str | None = None                 # graded only
    grade: Decimal | None = None               # graded only
    market: Decimal | None = None
    low: Decimal | None = None
    mid: Decimal | None = None
    high: Decimal | None = None
```

**`models/inventory.py`** — `InventoryItem` is a discriminated union on `kind`, so raw vs. graded are distinct validated shapes:
```python
class Condition(StrEnum):
    NM = "NM"; LP = "LP"; MP = "MP"; HP = "HP"; DMG = "DMG"

class GradingCompany(StrEnum):
    PSA = "PSA"; BGS = "BGS"; CGC = "CGC"; SGC = "SGC"

class _ItemBase(BaseModel):
    card_id: str
    quantity: int
    listed_price: Decimal
    cost_basis: Decimal
    current_market_value: Decimal | None = None
    acquired_at: date

class RawInventoryItem(_ItemBase):
    kind: Literal["raw"]
    finish: str
    condition: Condition

class GradedInventoryItem(_ItemBase):
    kind: Literal["graded"]
    company: GradingCompany
    grade: Decimal
    cert_number: str

InventoryItem = Annotated[
    RawInventoryItem | GradedInventoryItem,
    Field(discriminator="kind"),
]
```

**Repository — `services/dynamodb.py`**

A class `InventoryRepository` wrapping `boto3.resource("dynamodb").Table(name)`. Constructed with the table name + optional `endpoint_url` (so tests can point at a local/mocked DynamoDB). It owns model↔item (de)serialization and **all `Decimal` conversion**. It is **pure persistence** — no filtering, sorting, or profit math (those live in the slices that consume it).

```python
# catalog
get_catalog_card(card_id) -> CatalogCard | None
list_cards_by_set(set_id) -> list[CatalogCard]
batch_upsert_catalog_cards(cards: list[CatalogCard]) -> None
set_graded_market_value(card_id, company, grade, value) -> None   # admin manual entry

# prices (history)
append_price_points(points: list[PricePoint]) -> None
get_price_history(card_id, *, finish=None, company=None, grade=None,
                  start=None, end=None) -> list[PricePoint]

# inventory
put_inventory_item(item: InventoryItem) -> None
get_inventory_item(<key fields>) -> InventoryItem | None
list_inventory() -> list[InventoryItem]                  # PK=INV, one query
list_inventory_for_card(card_id) -> list[InventoryItem]  # GSI1
delete_inventory_item(<key fields>) -> None
refresh_inventory_market_values(price_lookup) -> int     # sync denormalizes current_market_value
```

---

## 4. PokemonTCG.io client & daily sync

**`services/pokemontcg.py`** — thin `httpx` client over `https://api.pokemontcg.io/v2`, sending `X-Api-Key` from a new `POKEMONTCG_API_KEY` setting.
- `iter_all_cards()` — paginates `/cards` at `pageSize=250` (~80 requests for the whole catalog), yields raw dicts
- `get_card(card_id)` — `/cards/{id}` for single-card refresh / trade-target lookups; 404 → `None`
- `to_catalog_card(raw) -> CatalogCard` — pure mapper extracting id, name, set, number, rarity, types, images, and the **TCGplayer** `prices` map. Cards with no TCGplayer prices map to an empty `prices` map (handled, not an error).

**`services/catalog_sync.py`** — orchestration as plain callables taking `(repo, client, today)` so they're testable without a scheduler:

1. **`sync_catalog`** — iterate all cards → `batch_upsert_catalog_cards` (chunked to 25) → append one **raw** `PricePoint` per `(card, finish)` dated `today`.
2. **`snapshot_graded_prices`** — for each **owned** graded `(card, company, grade)` derived from `list_inventory()` (no full-table scan), read the card's manual `graded_prices` and append a **graded** `PricePoint` for `today`.
3. **`refresh_inventory_market_values`** — recompute each inventory item's denormalized `current_market_value` from freshly-synced prices (raw → `prices[finish].market`; graded → `graded_prices["COMPANY#grade"]`).
4. **`run_daily_sync`** = 1 → 2 → 3; returns a summary (cards synced, price points written, items refreshed, failures) for logging.

**Idempotency & resilience:**
- Price points are **date-keyed** and catalog upserts overwrite by key → re-running the same day is safe and produces no duplicates; a crashed run can simply be re-run.
- Retry with backoff on `429`/`5xx`; well under the ~20k/day key limit (~80 requests/run).
- A single bad card is logged and **skipped, not fatal**; the run continues and reports a failure count.

**Config / dependency changes outside the schema:**
- Move `httpx` from dev-only to runtime deps in `pyproject.toml`; add `moto` to dev deps.
- Add `POKEMONTCG_API_KEY` to `config.py` and `.env.example`.

---

## 5. Error handling

- **Decimal discipline** centralized in the repository serializer: floats → `Decimal` on write, reject `NaN`/`Infinity`, parse `Decimal` on read.
- **Repository:** `get_*` returns `None` for not-found (not an exception); Pydantic `ValidationError` surfaces malformed models; unexpected boto3 `ClientError` bubbles up (infra errors are not swallowed).
- **PokemonTCG.io client:** timeouts / `5xx` / `429` → retry with backoff, then raise `PokemonTcgError`; `get_card` 404 → `None`; missing TCGplayer prices → empty `prices` map.
- **Sync:** per-card skip-and-continue with a failure count in the summary; idempotent, so re-running is always safe.

---

## 6. Testing strategy (TDD)

Tests are written RED-first, one behavior at a time, per the project's outside-in TDD process.

| Layer | Boundary | Coverage |
|---|---|---|
| Pydantic models | pure | discriminated union raw vs. graded, required fields per kind, `Decimal` coercion |
| Repository `dynamodb.py` | **`moto`** (`@mock_aws`) | every access pattern: catalog upsert/get, list-by-set (GSI1), inventory put/list (INV partition), list-for-card (GSI1 `begins_with`), price-history range (`between`/`begins_with`), 25-item batch chunking, `Decimal` round-trip, not-found → `None` |
| `to_catalog_card` mapper | pure (real sample JSON) | multi-finish card, card with **no** prices, field extraction |
| PokemonTCG client | `httpx.MockTransport` | pagination, retry/backoff — real `httpx` path, no network |
| Sync orchestration | `moto` repo + fake client | catalog upserted, raw price points appended, graded snapshot for **owned** slabs, `current_market_value` refreshed, **idempotency (run twice/day → no dupes)**, per-card skip-and-continue |

**Test boundary choice:** use **`moto`** rather than DynamoDB Local. moto is an emulator (not a hand-rolled mock) that exercises boto3 marshalling, GSI queries, `begins_with`/`between`, and batch writes — satisfying "prefer real boundaries" while staying hermetic and Docker-free (simpler Windows dev + CI). DynamoDB Local offers marginally higher fidelity at the cost of Docker in every test run; deferred.

Run via `python -m pytest backend/tests -q --tb=short`.

---

## 7. New / changed files

```
backend/src/merlins_collection/
├── models/
│   ├── catalog.py        # NEW — CatalogCard, FinishPrice, CardImages, PricePoint
│   └── inventory.py      # NEW — Condition, GradingCompany, InventoryItem union
├── services/
│   ├── dynamodb.py       # IMPLEMENT — InventoryRepository
│   ├── pokemontcg.py     # NEW — PokemonTCG.io client + to_catalog_card mapper
│   └── catalog_sync.py   # NEW — sync_catalog, snapshot_graded_prices,
│                         #       refresh_inventory_market_values, run_daily_sync
├── config.py             # CHANGE — add POKEMONTCG_API_KEY
└── ...
backend/.env.example      # CHANGE — add POKEMONTCG_API_KEY
backend/pyproject.toml    # CHANGE — httpx -> runtime deps; add moto to dev deps
backend/tests/
├── models/               # NEW — model validation tests
├── services/
│   ├── test_dynamodb.py     # IMPLEMENT — repository tests (moto)
│   ├── test_pokemontcg.py   # NEW — client + mapper tests
│   └── test_catalog_sync.py # NEW — sync orchestration tests
```

---

## 8. Future extensions (explicitly deferred)

- Automated graded-price feed (e.g., PriceCharting) replacing manual graded entry
- Scheduler wiring for `run_daily_sync` (EventBridge → Lambda or container cron) — the "price-update" slice
- `INV` partition sharding if inventory outgrows low-thousands
- Cardmarket (EUR) prices alongside TCGplayer
