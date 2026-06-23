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
