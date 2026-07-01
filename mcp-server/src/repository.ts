/**
 * Domain types and data-access boundary for the inventory MCP tools.
 *
 * Tools depend only on the `InventoryRepository` interface, never on a concrete
 * data source. Tests inject an in-memory implementation; production will inject a
 * DynamoDB-backed implementation (added separately).
 */

export type Card = {
  id: string;
  name: string;
  set: string;
  condition: string;
  quantity: number;
  /** Current listed value per unit (maps to CardResult.currentValue). */
  value: number;
  /** External market reference price per unit (used for flagging underpriced cards). */
  marketPrice: number;
};

export type PricePoint = {
  date: string;
  price: number;
  source: string;
};

export interface InventoryRepository {
  listCards(): Promise<Card[]>;
  getPriceHistory(cardId: string): Promise<PricePoint[]>;
}
