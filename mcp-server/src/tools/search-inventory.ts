import type { InventoryRepository } from "../repository.js";

export type SearchFilters = {
  name?: string;
  set?: string;
  condition?: string;
  minValue?: number;
  maxValue?: number;
};

export type CardResult = {
  id: string;
  name: string;
  set: string;
  condition: string;
  quantity: number;
  currentValue: number;
};

export async function searchInventory(
  repo: InventoryRepository,
  filters: SearchFilters,
): Promise<CardResult[]> {
  const cards = await repo.listCards();

  const matches = cards.filter((card) => {
    if (
      filters.name !== undefined &&
      !card.name.toLowerCase().includes(filters.name.toLowerCase())
    ) {
      return false;
    }
    if (filters.set !== undefined && card.set.toLowerCase() !== filters.set.toLowerCase()) {
      return false;
    }
    if (
      filters.condition !== undefined &&
      card.condition.toLowerCase() !== filters.condition.toLowerCase()
    ) {
      return false;
    }
    if (filters.minValue !== undefined && card.value < filters.minValue) {
      return false;
    }
    if (filters.maxValue !== undefined && card.value > filters.maxValue) {
      return false;
    }
    return true;
  });

  return matches.map((card) => ({
    id: card.id,
    name: card.name,
    set: card.set,
    condition: card.condition,
    quantity: card.quantity,
    currentValue: card.value,
  }));
}
