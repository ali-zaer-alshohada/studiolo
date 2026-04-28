/**
 * Italian definite + indefinite article inference.
 *
 * Pure heuristic: gender from word ending (with a small exception list),
 * then article from gender + initial sound.
 *
 * Rules implemented:
 *   masculine + (s+cons | z | ps | gn | x | y)  → lo / gli / uno
 *   masculine + vowel                            → l' / gli / un
 *   masculine + other consonant                  → il / i / un
 *   feminine + vowel                             → l' / le / un'
 *   feminine + other                             → la / le / una
 *
 * Confidence is "low" when ending is ambiguous (-e, or no recognized ending).
 */

export type Gender = "m" | "f";
export type Confidence = "high" | "medium" | "low";

export type ArticleSuggestion = {
  /** Definite singular: il / lo / la / l' */
  definite: string;
  /** Definite plural: i / gli / le */
  definitePlural: string;
  /** Indefinite singular: un / uno / una / un' */
  indefinite: string;
  gender: Gender;
  confidence: Confidence;
};

/** Common feminine nouns ending in -o (the -o defaults to masculine, these are exceptions). */
const FEM_OF_O = new Set([
  "mano", "radio", "moto", "foto", "auto", "dinamo", "metro", "biro", "eco",
]);

/** Common masculine nouns ending in -a (Greek-origin -ma + others). */
const MASC_OF_A = new Set([
  "problema", "tema", "sistema", "programma", "poema", "dramma", "schema",
  "diploma", "clima", "panorama", "cinema", "pianeta", "papa", "boa",
]);

function inferGender(noun: string): { gender: Gender; confidence: Confidence } {
  const w = noun.trim().toLowerCase();
  if (FEM_OF_O.has(w)) return { gender: "f", confidence: "high" };
  if (MASC_OF_A.has(w)) return { gender: "m", confidence: "high" };
  if (w.endsWith("zione") || w.endsWith("sione")) return { gender: "f", confidence: "high" };
  if (w.endsWith("trice")) return { gender: "f", confidence: "high" };
  if (w.endsWith("tore")) return { gender: "m", confidence: "high" };
  if (w.endsWith("tà") || w.endsWith("tù")) return { gender: "f", confidence: "high" };
  if (w.endsWith("o")) return { gender: "m", confidence: "high" };
  if (w.endsWith("a")) return { gender: "f", confidence: "high" };
  if (w.endsWith("e")) return { gender: "m", confidence: "low" }; // genuinely ambiguous
  return { gender: "m", confidence: "low" };
}

function startsWithVowel(s: string): boolean {
  return /^[aeiouàèéìòù]/i.test(s);
}

/** s+consonant, z, ps, gn, x, y — the "lo" cluster. */
function startsWithLoCluster(s: string): boolean {
  return /^(s[bcdfghjklmnpqrtvwz]|z|ps|gn|x|y)/i.test(s);
}

/**
 * Suggest definite + indefinite articles for a noun. Pure.
 * Returns null for empty input; returns a suggestion otherwise — confidence
 * tells the UI whether to show the article confidently or with a "?" hint.
 */
export function suggestArticle(noun: string): ArticleSuggestion | null {
  const w = noun.trim();
  if (w === "") return null;
  const { gender, confidence } = inferGender(w);
  const lower = w.toLowerCase();

  if (gender === "m") {
    if (startsWithLoCluster(lower)) {
      return { definite: "lo", definitePlural: "gli", indefinite: "uno", gender, confidence };
    }
    if (startsWithVowel(lower)) {
      return { definite: "l'", definitePlural: "gli", indefinite: "un", gender, confidence };
    }
    return { definite: "il", definitePlural: "i", indefinite: "un", gender, confidence };
  }
  // feminine
  if (startsWithVowel(lower)) {
    return { definite: "l'", definitePlural: "le", indefinite: "un'", gender, confidence };
  }
  return { definite: "la", definitePlural: "le", indefinite: "una", gender, confidence };
}
