/**
 * Italian passato-prossimo auxiliary inference.
 *
 * Most verbs take "avere"; a small set takes "essere":
 *   - movement / displacement (andare, venire, partire, tornare, salire, scendere, cadere)
 *   - state / change of state (essere, stare, restare, rimanere, diventare)
 *   - birth / death (nascere, morire)
 *   - reflexives (-rsi suffix) — always essere
 *   - a handful of psych verbs (piacere, dispiacere)
 *
 * Pure. Refine the ESSERE list as new cases come up.
 */

export type Auxiliary = "essere" | "avere";

/** Verbs that take "essere" in passato prossimo. NOT exhaustive. */
const ESSERE_VERBS = new Set([
  // movement
  "andare", "venire", "arrivare", "partire", "tornare", "ritornare",
  "uscire", "entrare", "salire", "scendere", "cadere", "sparire",
  "fuggire", "scappare",
  // state / change
  "essere", "stare", "restare", "rimanere", "diventare", "sembrare", "parere",
  "apparire", "comparire",
  // birth / death
  "nascere", "morire", "crescere",
  // psych & misc
  "piacere", "dispiacere", "succedere", "accadere", "capitare",
  "bastare", "mancare", "servire",
]);

/**
 * Infer the auxiliary verb (essere / avere) for a given infinitive.
 * Returns "essere" for known essere-takers and reflexives; "avere" otherwise.
 */
export function inferAuxiliary(infinitive: string): Auxiliary {
  const v = infinitive.trim().toLowerCase();
  if (v.endsWith("rsi")) return "essere"; // any reflexive
  if (ESSERE_VERBS.has(v)) return "essere";
  return "avere";
}

/** Conjugated forms of avere used in passato prossimo. */
const AVERE_FORMS = new Set(["ho", "hai", "ha", "abbiamo", "avete", "hanno"]);
/** Conjugated forms of essere used in passato prossimo. */
const ESSERE_FORMS = new Set(["sono", "sei", "è", "siamo", "siete"]);
// "loro sono" (essere 3p) overlaps with "loro sono" (essere 1s) — same form,
// fine for first-word detection. avete/hanno are 2p/3p — set covers all.

/**
 * Did the user start their answer with the WRONG auxiliary form for this verb?
 * Returns false if we can't tell (no recognizable auxiliary in their input).
 *
 * Used by the QuizCard wrong-state to surface a grammar tip only when the
 * mistake was specifically an auxiliary error — not a participle slip.
 */
export function userUsedWrongAuxiliary(
  userInput: string,
  expectedAuxiliary: Auxiliary,
): boolean {
  const first = userInput.trim().toLowerCase().split(/\s+/)[0] ?? "";
  if (first === "") return false;
  if (expectedAuxiliary === "essere" && AVERE_FORMS.has(first)) return true;
  if (expectedAuxiliary === "avere" && ESSERE_FORMS.has(first)) return true;
  return false;
}
