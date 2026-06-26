import { describe, expect, it } from "vitest";
import { getInventorySummary } from "../../tools/get-inventory-summary.js";
import { card } from "../fixtures/card.js";
import { InMemoryInventoryRepository } from "../fixtures/in-memory-repository.js";

describe("getInventorySummary", () => {
  it("returns total card count (sum of quantities) and total value", async () => {
    const repo = new InMemoryInventoryRepository([
      card({ id: "1", name: "Charizard", set: "Base Set", quantity: 1, value: 500 }),
      card({ id: "2", name: "Blastoise", set: "Base Set", quantity: 2, value: 300 }),
      card({ id: "3", name: "Pikachu", set: "Jungle", quantity: 40, value: 20 }),
    ]);

    const result = await getInventorySummary(repo);

    expect(result.totalCards).toBe(43); // 1 + 2 + 40
    expect(result.totalValue).toBeCloseTo(1900); // 500*1 + 300*2 + 20*40
  });

  it("returns number of unique sets represented", async () => {
    const repo = new InMemoryInventoryRepository([
      card({ id: "1", set: "Base Set" }),
      card({ id: "2", set: "Base Set" }),
      card({ id: "3", set: "Jungle" }),
    ]);

    const result = await getInventorySummary(repo);

    expect(result.uniqueSets).toBe(2);
  });

  it("returns top valued cards sorted by per-unit value descending", async () => {
    const repo = new InMemoryInventoryRepository([
      card({ id: "1", name: "Charizard", quantity: 1, value: 500 }),
      card({ id: "2", name: "Blastoise", quantity: 2, value: 300 }),
      card({ id: "3", name: "Pikachu", quantity: 40, value: 20 }),
    ]);

    const result = await getInventorySummary(repo);

    // Per-unit ranking, not holding value (holding order would be Pikachu, Blastoise, Charizard).
    expect(result.topValuedCards).toEqual([
      { name: "Charizard", value: 500 },
      { name: "Blastoise", value: 300 },
      { name: "Pikachu", value: 20 },
    ]);
  });

  it("breaks ties in top valued cards by repository order", async () => {
    const repo = new InMemoryInventoryRepository([
      card({ id: "1", name: "First", value: 100 }),
      card({ id: "2", name: "Second", value: 100 }),
      card({ id: "3", name: "Third", value: 100 }),
    ]);

    const result = await getInventorySummary(repo);

    expect(result.topValuedCards).toEqual([
      { name: "First", value: 100 },
      { name: "Second", value: 100 },
      { name: "Third", value: 100 },
    ]);
  });

  it("limits top valued cards to the highest five", async () => {
    const repo = new InMemoryInventoryRepository([
      card({ id: "1", name: "A", value: 100 }),
      card({ id: "2", name: "B", value: 600 }),
      card({ id: "3", name: "C", value: 200 }),
      card({ id: "4", name: "D", value: 500 }),
      card({ id: "5", name: "E", value: 300 }),
      card({ id: "6", name: "F", value: 400 }),
    ]);

    const result = await getInventorySummary(repo);

    expect(result.topValuedCards).toEqual([
      { name: "B", value: 600 },
      { name: "D", value: 500 },
      { name: "F", value: 400 },
      { name: "E", value: 300 },
      { name: "C", value: 200 },
    ]);
  });

  it("returns zero values when inventory is empty", async () => {
    const repo = new InMemoryInventoryRepository([]);

    const result = await getInventorySummary(repo);

    expect(result).toEqual({
      totalCards: 0,
      totalValue: 0,
      uniqueSets: 0,
      topValuedCards: [],
    });
  });
});
