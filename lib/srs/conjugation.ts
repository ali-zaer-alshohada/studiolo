import type { Card, Tense, Pronoun, ConjugationTable } from "./types";
import { normalize } from "@/lib/text/normalize";
import { buildRegularTable } from "./regular-conjugator";
import { inferAuxiliary } from "@/lib/italian/auxiliary";
import { lookupIrregular } from "@/data/seedVerbs";

const TENSE_LABEL_IT: Record<Tense, string> = {
  infinito: "infinito",
  presente: "presente",
  passato_prossimo: "passato prossimo",
  imperfetto: "imperfetto",
  futuro_semplice: "futuro semplice",
  condizionale_presente: "condizionale presente",
  presente_progressivo: "presente progressivo",
};

const PRONOUN_LABEL_IT: Record<Pronoun, string> = {
  io: "io",
  tu: "tu",
  lui: "lui / lei",
  noi: "noi",
  voi: "voi",
  loro: "loro",
};

/**
 * English macro per (tense, pronoun) — a quiet hint of what form is being
 * asked. Doesn't try to perfectly conjugate the verb; uses generic markers
 * like "did" or "used to" so the user can map their English mental model
 * to the Italian form. Templates avoid "-ed" suffixes that would mangle
 * irregulars (avoids "have-ed", "be-ed", etc).
 *
 * Reading C of the verb-chart redesign — pure label, no per-verb data.
 */
const ENGLISH_TENSE_HINT: Record<Tense, string> = {
  infinito: "to {verb}",
  presente: "{pron} {verb}",
  passato_prossimo: "{pron} did {verb}",
  imperfetto: "{pron} used to {verb}",
  futuro_semplice: "{pron} will {verb}",
  condizionale_presente: "{pron} would {verb}",
  presente_progressivo: "{pron} {be} {ving}",
};

const ENGLISH_PRONOUN: Record<Pronoun, string> = {
  io: "I",
  tu: "you",
  lui: "he / she",
  noi: "we",
  voi: "you (pl)",
  loro: "they",
};

const ENGLISH_BE: Record<Pronoun, string> = {
  io: "am",
  tu: "are",
  lui: "is",
  noi: "are",
  voi: "are",
  loro: "are",
};

/** Strip a leading "to " from card.en to get the bare English verb. */
function bareEnglishVerb(en: string): string {
  return en.replace(/^to\s+/i, "").trim();
}

/**
 * Bare-verb → -ing form. Handles the common e-drop rule
 * (have → having, take → taking) but leaves rarer cases alone
 * (lie → lieing, run → runing) — the hint is intentionally rough.
 */
function verbToIng(verb: string): string {
  if (verb.endsWith("e") && !verb.endsWith("ee") && verb.length > 2) {
    return verb.slice(0, -1) + "ing";
  }
  return verb + "ing";
}

/** Build the English macro hint for a (tense, pronoun, card.en) triple. */
export function englishHint(tense: Tense, pronoun: Pronoun, en: string): string {
  const verb = bareEnglishVerb(en);
  return ENGLISH_TENSE_HINT[tense]
    .replaceAll("{pron}", ENGLISH_PRONOUN[pronoun])
    .replaceAll("{be}", ENGLISH_BE[pronoun])
    .replaceAll("{ving}", verbToIng(verb))
    .replaceAll("{verb}", verb);
}

export type ConjugationPrompt = {
  /** The card the prompt belongs to. */
  card: Card;
  tense: Tense;
  pronoun: Pronoun;
  /** Italian label like "presente", "passato prossimo". */
  tenseLabel: string;
  /** Italian label like "io", "lui / lei". */
  pronounLabel: string;
  /** Quiet English macro: "I will {verb}", "to {verb}", etc. Optional hint. */
  englishLabel: string;
  /** The expected conjugated form (e.g., "andiamo"). */
  expected: string;
};

/** Enumerate all (tense, pronoun) cells that have a non-empty value. */
function listFilledCells(
  table: ConjugationTable,
): Array<{ tense: Tense; pronoun: Pronoun; expected: string }> {
  const out: Array<{ tense: Tense; pronoun: Pronoun; expected: string }> = [];
  for (const tense of Object.keys(table) as Tense[]) {
    const tenseRow = table[tense];
    if (!tenseRow) continue;
    for (const pronoun of Object.keys(tenseRow) as Pronoun[]) {
      const cell = tenseRow[pronoun];
      if (typeof cell === "string" && cell.trim() !== "") {
        out.push({ tense, pronoun, expected: cell });
      }
    }
  }
  return out;
}

/**
 * Get the conjugation table for a card — explicit `card.conj` if present,
 * otherwise computed on-the-fly from the infinitive (`card.it`).
 *
 * Resolution order:
 *   1. `card.conj` (hand-curated via /aggiungi/verbo)
 *   2. `lookupIrregular(card.it)` — the seedVerbs irregular database
 *   3. `buildRegularTable(card.it)` — `regularize()` for safe -are verbs only
 *   4. null — caller treats as non-conjugatable
 *
 * This is the engine that lets bulk-imported verbs work in coniugazione
 * mode without per-card setup. Pure; the table flows through `pickConjugationPrompt`.
 */
export function resolveConj(card: Card): ConjugationTable | null {
  if (card.conj) return card.conj;
  if (card.cat !== "verbo") return null;
  const inf = card.it.trim().toLowerCase();
  if (!inf) return null;
  const irregular = lookupIrregular(inf);
  if (irregular) return irregular;
  const aux = inferAuxiliary(inf);
  return buildRegularTable(inf, aux);
}

/** True iff the card can produce at least one conjugation prompt. */
export function isConjugatable(card: Card): boolean {
  const table = resolveConj(card);
  if (!table) return false;
  return listFilledCells(table).length > 0;
}

/**
 * Pick a random (tense, pronoun) cell from a card's conjugation table.
 * Returns null if the card has no resolvable conjugation table or no
 * filled cells.
 *
 * The table is resolved via `resolveConj` — explicit `card.conj` first,
 * then irregular lookup, then regular fallback. Pure given an injectable
 * rng — tests can use a seeded rng.
 */
export function pickConjugationPrompt(
  card: Card,
  rng: () => number = Math.random,
): ConjugationPrompt | null {
  const table = resolveConj(card);
  if (!table) return null;
  const cells = listFilledCells(table);
  if (cells.length === 0) return null;
  const idx = Math.floor(rng() * cells.length);
  const cell = cells[Math.min(idx, cells.length - 1)];
  if (!cell) return null;
  return {
    card,
    tense: cell.tense,
    pronoun: cell.pronoun,
    tenseLabel: TENSE_LABEL_IT[cell.tense],
    pronounLabel: PRONOUN_LABEL_IT[cell.pronoun],
    englishLabel: englishHint(cell.tense, cell.pronoun, card.en),
    expected: cell.expected,
  };
}

/**
 * Grade a user's conjugation answer against the prompt's expected form.
 * Uses `normalize` (case-insensitive, punctuation/whitespace tolerant).
 */
export function gradeConjugation(
  prompt: ConjugationPrompt,
  input: string,
): { ok: boolean; expected: string; userInput: string } {
  return {
    ok: normalize(input) === normalize(prompt.expected),
    expected: prompt.expected,
    userInput: input,
  };
}
