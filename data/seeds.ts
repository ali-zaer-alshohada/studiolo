import type { Card, Category } from "@/lib/srs/types";

/**
 * 25 seed cards ported verbatim from the prototype (postilla studiolo.html line 1894).
 * "Marian" appears in seed 9 — the prototype had a one-time migration from "Marco";
 * we ship "Marian" as the canonical value.
 */
type SeedDraft = { en: string; it: string; cat: Category };

const SEEDS: ReadonlyArray<SeedDraft> = [
  { en: "the table", it: "il tavolo", cat: "sostantivo" },
  { en: "the problem", it: "il problema", cat: "sostantivo" },
  { en: "the hand", it: "la mano", cat: "sostantivo" },
  { en: "the day", it: "il giorno", cat: "sostantivo" },
  { en: "the night", it: "la notte", cat: "sostantivo" },
  { en: "the book", it: "il libro", cat: "sostantivo" },
  { en: "the city", it: "la città", cat: "sostantivo" },
  { en: "I am going", it: "sto andando", cat: "verbo" },
  { en: "I went to Turin", it: "sono andato a Torino", cat: "verbo" },
  { en: "I see Marian every day", it: "vedo Marian ogni giorno", cat: "verbo" },
  { en: "I think about you", it: "penso a te", cat: "verbo" },
  { en: "we have eaten", it: "abbiamo mangiato", cat: "verbo" },
  { en: "they came", it: "sono venuti", cat: "verbo" },
  { en: "to fall asleep", it: "addormentarsi", cat: "verbo" },
  { en: "me (object)", it: "mi", cat: "pronome" },
  { en: "him (object)", it: "lo", cat: "pronome" },
  { en: "to her", it: "le", cat: "pronome" },
  { en: "of it / about it", it: "ne", cat: "pronome" },
  { en: "in the morning", it: "di mattina", cat: "preposizione" },
  { en: "on Monday", it: "di lunedì", cat: "preposizione" },
  { en: "with us", it: "con noi", cat: "preposizione" },
  { en: "beautiful", it: "bello", cat: "aggettivo" },
  { en: "green", it: "verde", cat: "aggettivo" },
  { en: "tired", it: "stanco", cat: "aggettivo" },
  { en: "slowly", it: "lentamente", cat: "altro" },
];

/**
 * Build a fresh `Card` from a seed draft.
 * Pure & deterministic given (draft, now, idCounter) — used by the deck store.
 */
export function makeSeedCard(draft: SeedDraft, now: number, idSeed: string): Card {
  return {
    id: idSeed,
    en: draft.en,
    it: draft.it,
    cat: draft.cat,
    rung: 0,
    charge: 0,
    due: now, // due immediately on first run, so the seeded queue has a body of 25
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: now,
  };
}

export function makeAllSeedCards(now: number = Date.now()): Card[] {
  // Pre-spread the due times by a small jitter so they don't all sort identically.
  return SEEDS.map((draft, i) =>
    makeSeedCard(draft, now - i, `seed-${i.toString(36)}-${now.toString(36)}`),
  );
}

export const SEED_COUNT = SEEDS.length;
