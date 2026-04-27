import type { Card } from "./types";
import { normalize } from "@/lib/text/normalize";

export type GradeResult = {
  /** Whether the user's input matches the card's canonical Italian answer. */
  ok: boolean;
  /** The card's canonical correct answer (card.it) as-is. */
  correct: string;
  /** The user's input verbatim (NOT normalized). Used for the wrong-line display and the error log. */
  userInput: string;
};

/**
 * Grade an answer against a card. Comparison uses `normalize` (case-insensitive,
 * trailing-punctuation-tolerant, whitespace-collapsing). Accented characters are
 * preserved — Italian orthography is meaningful.
 */
export function gradeAnswer(card: Card, input: string): GradeResult {
  const ok = normalize(input) === normalize(card.it);
  return { ok, correct: card.it, userInput: input };
}

// ─── inferCtx ─────────────────────────────────────────────────────
// Heuristic: what kind of mistake was this?
// Used by the deck store's gradeWrong action to tag the ErrorEvent and decide
// which chained-child bucket the wrong belongs to.

const ARTICLES = new Set(["il", "lo", "la", "i", "gli", "le", "un", "uno", "una"]);
const AUXILIARIES = new Set([
  "ho", "hai", "ha", "abbiamo", "avete", "hanno",
  "sono", "sei", "è", "siamo", "siete",
]);
const PREPOSITIONS = new Set([
  "di", "a", "da", "in", "con", "su", "per", "tra", "fra",
]);

/**
 * Infer the *kind* of mistake by diffing the first differing word between
 * `wrong` and `correct`. Returns one of:
 *   - "genere"       (article disagreement, e.g. la/il)
 *   - "ausiliare"    (wrong auxiliary verb, e.g. ho/sono)
 *   - "preposizione" (wrong preposition, e.g. di/a)
 *   - "traduzione"   (anything else — generic translation error)
 *
 * Heuristic and tolerant of empty inputs. The chained-children mechanism keys
 * off this string, so consistency matters more than perfect linguistic correctness.
 *
 * TODO(ali): refinements to consider:
 *   - "concordanza"   (number/gender agreement on adjectives)
 *   - "tempo"         (wrong tense — past for present, etc.)
 *   - "modo"          (indicative vs subjunctive)
 *   - "ortografia"    (spelling slip — single character diff)
 * The current 4-bucket version is enough to make chained children work.
 */
export function inferCtx(wrong: string, correct: string): string {
  const w = normalize(wrong).split(/\s+/).filter(Boolean);
  const c = normalize(correct).split(/\s+/).filter(Boolean);

  // Empty user input → "didn't try" → generic. Don't infer from the correct answer alone.
  if (w.length === 0) return "traduzione";

  // Find the first index where they differ.
  for (let i = 0; i < Math.max(w.length, c.length); i++) {
    const wi = w[i];
    const ci = c[i];
    if (wi === ci) continue;

    const tokens = [wi, ci].filter((x): x is string => x !== undefined);
    if (tokens.some((t) => ARTICLES.has(t))) return "genere";
    if (tokens.some((t) => AUXILIARIES.has(t))) return "ausiliare";
    if (tokens.some((t) => PREPOSITIONS.has(t))) return "preposizione";
    break;
  }

  return "traduzione";
}
