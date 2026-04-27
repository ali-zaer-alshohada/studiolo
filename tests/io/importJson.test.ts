import { describe, test, expect } from "vitest";
import { parseImport } from "@/lib/io/importJson";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(id: string): Card {
  return {
    id,
    en: id,
    it: id,
    cat: "altro",
    rung: 0,
    due: NOW,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW,
  };
}

describe("parseImport — v1 envelope", () => {
  test("accepts a valid v1 envelope", () => {
    const env = {
      version: 1,
      exportedAt: "2026-04-27T18:00:00.000Z",
      deck: {
        cards: [mkCard("a"), mkCard("b")],
        errors: [],
        sessions: [],
        streakLastDay: null,
        streakCount: 0,
        lastBackup: null,
      },
    };
    const result = parseImport(JSON.stringify(env));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.cardCount).toBe(2);
    expect(result.preview.errorCount).toBe(0);
    expect(result.preview.exportedAt).toBe("2026-04-27T18:00:00.000Z");
  });

  test("normalizes missing optional fields", () => {
    const env = {
      version: 1,
      exportedAt: "2026-04-27T18:00:00.000Z",
      deck: { cards: [mkCard("a")] },
    };
    const result = parseImport(JSON.stringify(env));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.normalized.errors).toEqual([]);
    expect(result.preview.normalized.sessions).toEqual([]);
    expect(result.preview.normalized.streakLastDay).toBeNull();
    expect(result.preview.normalized.streakCount).toBe(0);
    expect(result.preview.normalized.lastBackup).toBeNull();
  });
});

describe("parseImport — v0 / prototype shape", () => {
  test("accepts a flat prototype-style export and auto-wraps", () => {
    const flat = {
      cards: [mkCard("a")],
      errors: [],
      sessions: [],
      streakLastDay: "2026-4-26",
      streakCount: 5,
      lastBackup: NOW,
    };
    const result = parseImport(JSON.stringify(flat));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.cardCount).toBe(1);
    expect(result.preview.exportedAt).toBeNull();
    expect(result.preview.normalized.streakCount).toBe(5);
  });
});

describe("parseImport — invalid", () => {
  test("rejects garbage JSON", () => {
    expect(parseImport("not json").ok).toBe(false);
  });

  test("rejects JSON without cards", () => {
    expect(parseImport(JSON.stringify({ version: 1, deck: {} })).ok).toBe(false);
  });

  test("rejects JSON where cards is not an array", () => {
    expect(parseImport(JSON.stringify({ cards: "nope" })).ok).toBe(false);
  });

  test("rejects a card missing required fields", () => {
    const result = parseImport(
      JSON.stringify({ cards: [{ id: "a", en: "x" }] }),
    );
    expect(result.ok).toBe(false);
  });
});
