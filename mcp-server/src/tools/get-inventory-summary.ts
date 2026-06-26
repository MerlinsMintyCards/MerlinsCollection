import type { InventoryRepository } from "../repository.js";

export type InventorySummaryResult = {
  totalCards: number;
  totalValue: number;
  uniqueSets: number;
  topValuedCards: Array<{ name: string; value: number }>;
};

const TOP_VALUED_LIMIT = 5;

export async function getInventorySummary(
  repo: InventoryRepository,
): Promise<InventorySummaryResult> {
  const cards = await repo.listCards();

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const totalValue = cards.reduce((sum, card) => sum + card.value * card.quantity, 0);
  const uniqueSets = new Set(cards.map((card) => card.set)).size;
  const topValuedCards = [...cards]
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_VALUED_LIMIT)
    .map((card) => ({ name: card.name, value: card.value }));

  return { totalCards, totalValue, uniqueSets, topValuedCards };
}
