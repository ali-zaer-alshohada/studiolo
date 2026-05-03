import { describe, test, expect } from "vitest";
import { selectGiocoPool, buildBoard } from "@/components/gioco/GiocoView";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(id: string, lives: number | undefined): Card {
  return {
    id,
    en: `${id}-en`,
    it: `${id}-it`,
    cat: "verbo",
    rung: 0,
    charge: 0,
    due: NOW,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW,
    giocoLives: lives,
  };
}

describe("selectGiocoPool", () => {
  test("includes cards with giocoLives > 0", () => {
    const a = mkCard("a", 3);
    const b = mkCard("b", 1);
    expect(selectGiocoPool([a, b]).map((c) => c.id)).toEqual(["a", "b"]);
  });

  test("excludes cards with giocoLives === 0 or undefined", () => {
    const a = mkCard("a", 0);
    const b = mkCard("b", undefined);
    const c = mkCard("c", 2);
    expect(selectGiocoPool([a, b, c]).map((x) => x.id)).toEqual(["c"]);
  });

  test("returns empty array for empty input", () => {
    expect(selectGiocoPool([])).toEqual([]);
  });
});

describe("buildBoard", () => {
  test("produces 16 cells with 8 unique cardIds when pool >= 8", () => {
    const pool = Array.from({ length: 10 }, (_, i) => mkCard(`c${i}`, 3));
    const board = buildBoard(pool);
    expect(board).toHaveLength(16);
    const cardCells = board.filter((c) => c.kind === "card");
    expect(cardCells).toHaveLength(16);
    const ids = new Set(cardCells.map((c) => (c as { cardId: string }).cardId));
    expect(ids.size).toBe(8); // 8 unique cards, 2 cells each
  });

  test("each card appears as both en AND it sides", () => {
    const pool = Array.from({ length: 8 }, (_, i) => mkCard(`c${i}`, 3));
    const board = buildBoard(pool);
    const sidesByCard = new Map<string, Set<string>>();
    for (const cell of board) {
      if (cell.kind !== "card") continue;
      if (!sidesByCard.has(cell.cardId))
        sidesByCard.set(cell.cardId, new Set());
      sidesByCard.get(cell.cardId)!.add(cell.side);
    }
    for (const sides of sidesByCard.values()) {
      expect(sides).toEqual(new Set(["en", "it"]));
    }
  });

  test("pads with empty cells when pool < 8", () => {
    const pool = Array.from({ length: 3 }, (_, i) => mkCard(`c${i}`, 3));
    const board = buildBoard(pool);
    expect(board).toHaveLength(16);
    const cardCells = board.filter((c) => c.kind === "card");
    expect(cardCells).toHaveLength(6); // 3 cards × 2 sides
    expect(board.filter((c) => c.kind === "empty")).toHaveLength(10);
  });

  test("handles empty pool", () => {
    const board = buildBoard([]);
    expect(board).toHaveLength(16);
    expect(board.every((c) => c.kind === "empty")).toBe(true);
  });

  test("all card cells start unrevealed", () => {
    const pool = Array.from({ length: 8 }, (_, i) => mkCard(`c${i}`, 3));
    const board = buildBoard(pool);
    for (const cell of board) {
      if (cell.kind === "card") expect(cell.revealed).toBe(false);
    }
  });
});
