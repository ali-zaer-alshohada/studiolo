import type { Category } from "@/lib/srs/types";

/**
 * Heuristic Italian category detector. Returns the inferred `Category` or
 * `null` when nothing matches (the user must pick manually in Aggiungi).
 *
 * Ported from prototype line 1832. Order matters: the article check fires
 * before the pronoun check so "lo zaino" → sostantivo, not pronome.
 *
 * TODO(ali): refinements you might want once you start adding real cards:
 *   - "essere" / "avere" infinitives currently match the -ere rule (verbo) ✓
 *   - bare pronouns like "lo" / "la" / "le" without a following noun are
 *     classified as sostantivo (because the article check fires first). The
 *     prototype matches; if you want bare-pronoun detection, swap the order.
 *   - adjectives have no signal; null is the right answer.
 */

const ARTICLES = new Set([
  "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "un'",
]);

const AUXILIARY_VERBS = new Set([
  "ho", "hai", "ha", "abbiamo", "avete", "hanno",
  "sono", "sei", "è", "siamo", "siete",
]);

const PRONOUNS = new Set([
  "mi", "ti", "si", "ci", "vi", "lo", "la", "li", "le", "gli", "ne",
]);

const PREPOSITIONS = new Set([
  "di", "a", "da", "in", "con", "su", "per", "tra", "fra",
]);

const INFINITIVE_ENDING = /(?:are|ere|ire|arsi|ersi|irsi)$/;

export function detectCat(input: string): Category | null {
  const s = (input ?? "").trim().toLowerCase();
  if (!s) return null;

  const first = s.split(/\s+/)[0] ?? "";

  if (ARTICLES.has(first)) return "sostantivo";
  if (AUXILIARY_VERBS.has(first)) return "verbo";
  if (INFINITIVE_ENDING.test(s)) return "verbo";
  if (PRONOUNS.has(first)) return "pronome";
  if (PREPOSITIONS.has(first)) return "preposizione";

  return null;
}
