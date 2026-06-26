import type { InventoryRepository } from "../repository.js";

export type UnderpricedCard = {
  id: string;
  name: string;
  set: string;
  listedPrice: number;
  marketPrice: number;
  discountPercent: number;
};

export type FlagUnderpricedResult = {
  flaggedCards: UnderpricedCard[];
  thresholdPercent: number;
};

export async function flagUnderpricedCards(
  repo: InventoryRepository,
  thresholdPercent: number,
): Promise<FlagUnderpricedResult> {
  const cards = await repo.listCards();

  const flaggedCards: UnderpricedCard[] = [];
  for (const card of cards) {
    // Skip cards without a usable market reference (avoids divide-by-zero on the discount).
    if (card.marketPrice <= 0) {
      continue;
    }
    if (card.value < card.marketPrice * (thresholdPercent / 100)) {
      flaggedCards.push({
        id: card.id,
        name: card.name,
        set: card.set,
        listedPrice: card.value,
        marketPrice: card.marketPrice,
        discountPercent: ((card.marketPrice - card.value) / card.marketPrice) * 100,
      });
    }
  }

  return { flaggedCards, thresholdPercent };
}
