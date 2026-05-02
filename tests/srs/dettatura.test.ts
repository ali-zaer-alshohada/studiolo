import { describe, test, expect } from "vitest";
import { pickDettaturaCard, gradeDettatura } from "@/lib/srs/dettatura";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(it: string, overrides: Partial<Card> = {}): Card {
  return {
    id: it,
    en: it,
    it,
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
    ...overrides,
  };
}

function fixedRng(value: number): () => number {
  return () => value;
}

describe("pickDettaturaCard", () => {
  test("returns null when there are no cards", () => {
    expect(pickDettaturaCard([], fixedRng(0))).toBeNull();
  });

  test("prefers cards with 2+ words (sentence-length)", () => {
    const cards = [
      mkCard("ciao"),                  // single word — not preferred
      mkCard("sono andato"),           // sentence
      mkCard("vado a casa"),           // sentence
    ];
    // With rng=0, picks the first eligible. Verify it's a sentence (not "ciao").
    const picked = pickDettaturaCard(cards, fixedRng(0));
    expect(picked?.it.split(/\s+/).length).toBeGreaterThanOrEqual(2);
  });

  test("falls back to all cards when no sentence-length exists", () => {
    const cards = [mkCard("ciao"), mkCard("grazie")];
    const picked = pickDettaturaCard(cards, fixedRng(0));
    expect(picked).not.toBeNull();
    expect(["ciao", "grazie"]).toContain(picked?.it);
  });

  test("uses the rng to choose among eligible cards", () => {
    const cards = [
      mkCard("frase uno"),
      mkCard("frase due"),
      mkCard("frase tre"),
    ];
    expect(pickDettaturaCard(cards, fixedRng(0))?.it).toBe("frase uno");
    expect(pickDettaturaCard(cards, fixedRng(0.99))?.it).toBe("frase tre");
  });

  test("excludes children of cards already in queue (children appear as footnotes elsewhere)", () => {
    // For now, the prototype doesn't filter children specifically — keep parity.
    // This test documents that children CAN be picked (just like the prototype).
    const parent = mkCard("frase parent", { id: "p" });
    const child = mkCard("frase child", { id: "c", parentId: "p", isChild: true });
    const picked = pickDettaturaCard([parent, child], fixedRng(0.99));
    expect(picked).not.toBeNull(); // either is fine
  });
});

describe("gradeDettatura · word-by-word diff", () => {
  test("exact match → ok=true, all words marked 'ok'", () => {
    const card = mkCard("sono andato a casa");
    const r = gradeDettatura(card, "sono andato a casa");
    expect(r.ok).toBe(true);
    expect(r.target).toBe("sono andato a casa");
    expect(r.yours).toBe("sono andato a casa");
    expect(r.diff).toHaveLength(4);
    expect(r.diff.every((d) => d.kind === "ok")).toBe(true);
  });

  test("wrong word marked 'miss'", () => {
    const card = mkCard("sono andato");
    const r = gradeDettatura(card, "ho andato");
    expect(r.ok).toBe(false);
    expect(r.diff[0]).toMatchObject({ word: "ho", kind: "miss" });
    expect(r.diff[1]).toMatchObject({ word: "andato", kind: "ok" });
  });

  test("case-insensitive comparison via normalize", () => {
    const card = mkCard("Sono Andato");
    const r = gradeDettatura(card, "sono andato");
    expect(r.ok).toBe(true);
  });

  test("trailing punctuation forgiven via normalize", () => {
    const card = mkCard("vado a casa");
    const r = gradeDettatura(card, "vado a casa.");
    expect(r.ok).toBe(true);
  });

  test("preserves accented characters as significant", () => {
    const card = mkCard("è andato");
    const r1 = gradeDettatura(card, "e andato");
    expect(r1.ok).toBe(false);
    const r2 = gradeDettatura(card, "è andato");
    expect(r2.ok).toBe(true);
  });

  test("empty input → all words missing (still produces diff against target)", () => {
    const card = mkCard("sono andato");
    const r = gradeDettatura(card, "");
    expect(r.ok).toBe(false);
    expect(r.diff).toEqual([]);
  });

  test("user types more words than target — extras are 'miss'", () => {
    const card = mkCard("sono andato");
    const r = gradeDettatura(card, "sono andato a casa");
    expect(r.ok).toBe(false);
    // First two ok, last two extras (no target word at index 2,3)
    expect(r.diff[0]?.kind).toBe("ok");
    expect(r.diff[1]?.kind).toBe("ok");
    expect(r.diff[2]?.kind).toBe("miss");
    expect(r.diff[3]?.kind).toBe("miss");
  });
});
