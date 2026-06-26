import type { Card, InventoryRepository, PricePoint } from "../../repository.js";

/**
 * A real (non-mock) in-memory implementation of InventoryRepository used as the
 * test boundary. Seed it per test via the constructor; it returns copies so
 * tools cannot mutate the seeded data.
 */
export class InMemoryInventoryRepository implements InventoryRepository {
  private readonly cards: Card[];
  private readonly priceHistory: Map<string, PricePoint[]>;

  constructor(cards: Card[] = [], priceHistory: Map<string, PricePoint[]> = new Map()) {
    this.cards = cards;
    this.priceHistory = priceHistory;
  }

  async listCards(): Promise<Card[]> {
    return this.cards.map((card) => ({ ...card }));
  }

  async getPriceHistory(cardId: string): Promise<PricePoint[]> {
    const history = this.priceHistory.get(cardId) ?? [];
    return history.map((point) => ({ ...point }));
  }
}
