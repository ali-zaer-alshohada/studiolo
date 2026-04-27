import type { Card, Tense, Pronoun, ConjugationTable } from "./types";
import { normalize } from "@/lib/text/normalize";

const TENSE_LABEL_IT: Record<Tense, string> = {
  presente: "presente",
  passato_prossimo: "passato prossimo",
  imperfetto: "imperfetto",
  futuro_semplice: "futuro semplice",
};

const PRONOUN_LABEL_IT: Record<Pronoun, string> = {
  io: "io",
  tu: "tu",
  lui: "lui / lei",
  noi: "noi",
  voi: "voi",
  loro: "loro",
};

export type ConjugationPrompt = {
  /** The card the prompt belongs to. */
  card: Card;
  tense: Tense;
  pronoun: Pronoun;
  /** Italian label like "presente", "passato prossimo". */
  tenseLabel: string;
  /** Italian label like "io", "lui / lei". */
  pronounLabel: string;
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
 * Pick a random (tense, pronoun) cell from a card's conjugation table.
 * Returns null if the card has no conjugation table or no filled cells.
 *
 * Pure given an injectable rng — tests can use a seeded rng.
 */
export function pickConjugationPrompt(
  card: Card,
  rng: () => number = Math.random,
): ConjugationPrompt | null {
  if (!card.conj) return null;
  const cells = listFilledCells(card.conj);
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
