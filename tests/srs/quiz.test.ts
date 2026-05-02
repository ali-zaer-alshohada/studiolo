import { describe, test, expect } from "vitest";
import { gradeAnswer, inferCtx } from "@/lib/srs/quiz";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    en: "I went",
    it: "sono andato",
    cat: "verbo",
    rung: 0,
    charge: 0,
    due: NOW,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW - 86_400_000,
    ...overrides,
  };
}

describe("gradeAnswer", () => {
  test("exact match → ok=true", () => {
    const card = mkCard({ it: "il tavolo" });
    expect(gradeAnswer(card, "il tavolo").ok).toBe(true);
  });

  test("case-insensitive match → ok=true", () => {
    const card = mkCard({ it: "il tavolo" });
    expect(gradeAnswer(card, "Il TaVoLo").ok).toBe(true);
  });

  test("trailing punctuation is ignored → ok=true", () => {
    const card = mkCard({ it: "sono andato" });
    expect(gradeAnswer(card, "sono andato.").ok).toBe(true);
    expect(gradeAnswer(card, "sono andato!").ok).toBe(true);
  });

  test("collapsed whitespace is forgiven → ok=true", () => {
    const card = mkCard({ it: "buon giorno" });
    expect(gradeAnswer(card, "buon  giorno").ok).toBe(true);
  });

  test("preserves accented characters as significant", () => {
    const card = mkCard({ it: "città" });
    expect(gradeAnswer(card, "città").ok).toBe(true);
    expect(gradeAnswer(card, "citta").ok).toBe(false);
  });

  test("different word → ok=false", () => {
    const card = mkCard({ it: "sono andato" });
    expect(gradeAnswer(card, "ho andato").ok).toBe(false);
  });

  test("empty input → ok=false", () => {
    const card = mkCard({ it: "il tavolo" });
    expect(gradeAnswer(card, "").ok).toBe(false);
    expect(gradeAnswer(card, "   ").ok).toBe(false);
  });

  test("returns the canonical correct (card.it) and user's verbatim input", () => {
    const card = mkCard({ it: "sono andato" });
    const r = gradeAnswer(card, "  HO ANDATO! ");
    expect(r.correct).toBe("sono andato");
    expect(r.userInput).toBe("  HO ANDATO! ");
  });
});

describe("inferCtx — what kind of mistake was this?", () => {
  test("returns 'genere' when only the article differs (la/il)", () => {
    expect(inferCtx("la problema", "il problema")).toBe("genere");
    expect(inferCtx("il mano", "la mano")).toBe("genere");
  });

  test("returns 'ausiliare' when the auxiliary verb is wrong (ho/sono)", () => {
    expect(inferCtx("ho andato", "sono andato")).toBe("ausiliare");
    expect(inferCtx("sono mangiato", "ho mangiato")).toBe("ausiliare");
  });

  test("returns 'preposizione' when only a preposition differs", () => {
    expect(inferCtx("penso di te", "penso a te")).toBe("preposizione");
    expect(inferCtx("vado a Roma", "vado in Roma")).toBe("preposizione");
  });

  test("falls back to 'traduzione' for unspecific differences", () => {
    expect(inferCtx("aaa bbb", "ccc ddd")).toBe("traduzione");
    expect(inferCtx("", "il tavolo")).toBe("traduzione");
  });
});
