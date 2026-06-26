import type { InventoryRepository } from "../repository.js";

export type InventoryValueResult = {
  totalValue: number;
  valueBySet: Record<string, number>;
  valueByCondition: Record<string, number>;
  calculatedAt: string;
};

export async function calculateInventoryValue(
  repo: InventoryRepository,
): Promise<InventoryValueResult> {
  const cards = await repo.listCards();

  let totalValue = 0;
  const valueBySet: Record<string, number> = {};
  const valueByCondition: Record<string, number> = {};

  for (const card of cards) {
    const holdingValue = card.value * card.quantity;
    totalValue += holdingValue;
    valueBySet[card.set] = (valueBySet[card.set] ?? 0) + holdingValue;
    valueByCondition[card.condition] = (valueByCondition[card.condition] ?? 0) + holdingValue;
  }

  return {
    totalValue,
    valueBySet,
    valueByCondition,
    calculatedAt: new Date().toISOString(),
  };
}
