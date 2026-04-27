import type { Tense } from "./types";

type Auxiliary = "essere" | "avere";
type Class = "are" | "ere" | "ire";

const ENDINGS: Record<Tense, Record<Class, readonly string[]>> = {
  presente: {
    are: ["o", "i", "a", "iamo", "ate", "ano"],
    ere: ["o", "i", "e", "iamo", "ete", "ono"],
    ire: ["o", "i", "e", "iamo", "ite", "ono"],
  },
  imperfetto: {
    are: ["avo", "avi", "ava", "avamo", "avate", "avano"],
    ere: ["evo", "evi", "eva", "evamo", "evate", "evano"],
    ire: ["ivo", "ivi", "iva", "ivamo", "ivate", "ivano"],
  },
  futuro_semplice: {
    // -are → er-stem (parlerò, NOT parlarò); -ere/-ire → keep stem-vowel
    are: ["erò", "erai", "erà", "eremo", "erete", "eranno"],
    ere: ["erò", "erai", "erà", "eremo", "erete", "eranno"],
    ire: ["irò", "irai", "irà", "iremo", "irete", "iranno"],
  },
  // Passato prossimo handled separately (compound tense).
  passato_prossimo: {
    are: [],
    ere: [],
    ire: [],
  },
};

const PARTICIPLE_ENDINGS: Record<Class, string> = {
  are: "ato",
  ere: "uto",
  ire: "ito",
};

const AUX_PRESENTE: Record<Auxiliary, readonly string[]> = {
  essere: ["sono", "sei", "è", "siamo", "siete", "sono"],
  avere: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"],
};

function classify(infinitive: string): { stem: string; cls: Class } | null {
  if (infinitive.endsWith("are")) return { stem: infinitive.slice(0, -3), cls: "are" };
  if (infinitive.endsWith("ere")) return { stem: infinitive.slice(0, -3), cls: "ere" };
  if (infinitive.endsWith("ire")) return { stem: infinitive.slice(0, -3), cls: "ire" };
  return null;
}

/**
 * Conjugate a regular Italian verb across the 6 pronouns for the given tense.
 * Returns `[io, tu, lui, noi, voi, loro]`, or `null` for non-infinitives /
 * passato_prossimo without an aux.
 *
 * Passato prossimo with `aux="essere"` uses masculine-plural agreement for noi/voi/loro
 * (sono partito · siamo partiti). Feminine variants are out of scope — irregulars
 * are hand-authored in `data/seedVerbs.ts`.
 *
 * Pure. No I/O. TDD'd in tests/srs/regular-conjugator.test.ts.
 */
export function regularize(
  infinitive: string,
  tense: Tense,
  aux?: Auxiliary,
): string[] | null {
  const c = classify(infinitive);
  if (!c) return null;

  if (tense === "passato_prossimo") {
    if (!aux) return null;
    const participle = c.stem + PARTICIPLE_ENDINGS[c.cls];
    const auxForms = AUX_PRESENTE[aux];
    if (aux === "essere") {
      // Agreement: masculine singular for io/tu/lui, masculine plural for noi/voi/loro.
      const sg = participle;
      const pl = participle.slice(0, -1) + "i";
      return [
        `${auxForms[0]} ${sg}`,
        `${auxForms[1]} ${sg}`,
        `${auxForms[2]} ${sg}`,
        `${auxForms[3]} ${pl}`,
        `${auxForms[4]} ${pl}`,
        `${auxForms[5]} ${pl}`,
      ];
    }
    // avere: participle invariant
    return auxForms.map((a) => `${a} ${participle}`);
  }

  return ENDINGS[tense][c.cls].map((ending) => c.stem + ending);
}
