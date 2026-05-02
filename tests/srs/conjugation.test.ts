import { describe, test, expect } from "vitest";
import { pickConjugationPrompt, gradeConjugation } from "@/lib/srs/conjugation";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(conj?: Card["conj"]): Card {
  return {
    id: "andare",
    en: "to go",
    it: "andare",
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
    conj,
  };
}

const FULL_TABLE = {
  presente: { io: "vado", tu: "vai", lui: "va", noi: "andiamo", voi: "andate", loro: "vanno" },
  imperfetto: { io: "andavo", tu: "andavi", lui: "andava", noi: "andavamo", voi: "andavate", loro: "andavano" },
};

describe("pickConjugationPrompt", () => {
  test("returns null when the card has no conj", () => {
    expect(pickConjugationPrompt(mkCard())).toBeNull();
  });

  test("returns null for an empty conjugation table", () => {
    expect(pickConjugationPrompt(mkCard({}))).toBeNull();
  });

  test("returns a prompt with tense + pronoun + expected for a populated table", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0);
    expect(p).not.toBeNull();
    expect(p?.tense).toBe("presente");
    expect(p?.pronoun).toBe("io");
    expect(p?.expected).toBe("vado");
    expect(p?.tenseLabel).toBe("presente");
    expect(p?.pronounLabel).toBe("io");
  });

  test("uses rng to pick across all filled cells", () => {
    const p1 = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0);
    const p2 = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0.99);
    expect(p1?.expected).not.toBe(p2?.expected);
  });

  test("skips empty cells in a partial table", () => {
    const partial = {
      presente: { io: "vado", tu: "" }, // tu is empty
    };
    const p = pickConjugationPrompt(mkCard(partial as Card["conj"]), () => 0.99);
    expect(p?.pronoun).toBe("io"); // never picks tu (empty)
    expect(p?.expected).toBe("vado");
  });
});

describe("gradeConjugation", () => {
  test("exact match → ok=true", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    expect(gradeConjugation(p, "vado").ok).toBe(true);
  });

  test("case-insensitive match", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    expect(gradeConjugation(p, "Vado").ok).toBe(true);
  });

  test("trailing punctuation forgiven", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    expect(gradeConjugation(p, "vado.").ok).toBe(true);
  });

  test("wrong form → ok=false", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    const r = gradeConjugation(p, "vai");
    expect(r.ok).toBe(false);
    expect(r.expected).toBe("vado");
    expect(r.userInput).toBe("vai");
  });
});
