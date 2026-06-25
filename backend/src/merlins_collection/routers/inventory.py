from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query

from merlins_collection.dependencies import get_current_user, get_repo
from merlins_collection.models.auth import AuthenticatedUser
from merlins_collection.models.inventory import Condition, InventorySearchResult
from merlins_collection.services.dynamodb import InventoryRepository

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get(
    "/search",
    response_model=InventorySearchResult,
    # cost_basis is internal purchase data — never expose it to customers
    response_model_exclude={"items": {"__all__": {"cost_basis"}}},
)
def search_inventory(
    name: str | None = Query(None, max_length=200),
    set_id: str | None = Query(None),
    rarity: str | None = Query(None),
    condition: Condition | None = Query(None),
    min_price: Decimal | None = Query(None),
    max_price: Decimal | None = Query(None),
    _user: AuthenticatedUser = Depends(get_current_user),
    repo: InventoryRepository = Depends(get_repo),
) -> InventorySearchResult:
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=422,
            detail="min_price must be <= max_price",
        )

    items = repo.list_inventory()

    # condition: raw items only; graded items are excluded when this filter is set
    if condition is not None:
        items = [i for i in items if i.kind == "raw" and i.condition == condition]

    if min_price is not None:
        items = [i for i in items if i.listed_price >= min_price]
    if max_price is not None:
        items = [i for i in items if i.listed_price <= max_price]

    # set_id: use the catalog GSI to get valid card_ids for the set
    if set_id is not None:
        set_card_ids = {c.card_id for c in repo.list_cards_by_set(set_id)}
        items = [i for i in items if i.card_id in set_card_ids]

    # name / rarity: require catalog lookup per remaining unique card_id
    if name is not None or rarity is not None:
        unique_card_ids = {i.card_id for i in items}
        catalog = {cid: repo.get_catalog_card(cid) for cid in unique_card_ids}

        if name is not None:
            name_lower = name.lower()
            items = [
                i for i in items
                if catalog.get(i.card_id) is not None
                and name_lower in catalog[i.card_id].name.lower()
            ]
        if rarity is not None:
            items = [
                i for i in items
                if catalog.get(i.card_id) is not None
                and catalog[i.card_id].rarity == rarity
            ]

    return InventorySearchResult(items=items, total=len(items))
