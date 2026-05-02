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
  condizionale_presente: {
    // Mirrors futuro stem (er-/ir-); endings -ei, -esti, -ebbe, -emmo, -este, -ebbero.
    are: ["erei", "eresti", "erebbe", "eremmo", "ereste", "erebbero"],
    ere: ["erei", "eresti", "erebbe", "eremmo", "ereste", "erebbero"],
    ire: ["irei", "iresti", "irebbe", "iremmo", "ireste", "irebbero"],
  },
  // Compound / lookup tenses — handled separately, not by stem+ending.
  passato_prossimo: { are: [], ere: [], ire: [] },
  infinito: { are: [], ere: [], ire: [] },
  presente_progressivo: { are: [], ere: [], ire: [] },
};

/** Regular gerund endings: -ando for -are; -endo for -ere/-ire. */
const GERUND_ENDINGS: Record<Class, string> = {
  are: "ando",
  ere: "endo",
  ire: "endo",
};

/** Irregular gerunds for common Italian verbs. */
const IRREGULAR_GERUNDS: Record<string, string> = {
  essere: "essendo",
  fare: "facendo",
  dire: "dicendo",
  bere: "bevendo",
  porre: "ponendo",
  trarre: "traendo",
};

/** stare in the present tense — needed to compose the progressive. */
const STARE_PRESENTE: readonly string[] = [
  "sto", "stai", "sta", "stiamo", "state", "stanno",
];

/**
 * Italian gerundio for any verb (regular by default, with a small irregular
 * lookup). Used to compose presente progressivo: stare + gerund.
 */
export function gerundOf(infinitive: string): string | null {
  const v = infinitive.trim().toLowerCase();
  if (IRREGULAR_GERUNDS[v]) return IRREGULAR_GERUNDS[v]!;
  const c = classify(infinitive);
  if (!c) return null;
  return c.stem + GERUND_ENDINGS[c.cls];
}

/**
 * Derive condizionale presente from the io-form of futuro semplice.
 * Italian conditional ALWAYS uses the same stem as the future, so this
 * works for both regulars (parlerò → parlerei) and irregulars (sarò → sarei,
 * andrò → andrei, avrò → avrei, vorrò → vorrei).
 */
export function condizionaleFromFuturo(futuroIoForm: string): string[] | null {
  // Strip "ò" off the io-form to get the stem (sarò → sar-).
  if (!futuroIoForm.endsWith("ò")) return null;
  const stem = futuroIoForm.slice(0, -1);
  return [
    `${stem}ei`,
    `${stem}esti`,
    `${stem}ebbe`,
    `${stem}emmo`,
    `${stem}este`,
    `${stem}ebbero`,
  ];
}

/**
 * Compose presente progressivo for a verb: stare-present + gerund.
 * E.g. andare → ["sto andando", "stai andando", ...].
 */
export function progressiveOf(infinitive: string): string[] | null {
  const ger = gerundOf(infinitive);
  if (!ger) return null;
  return STARE_PRESENTE.map((s) => `${s} ${ger}`);
}

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
 * "Safe to auto-regularize" check — a conservative gate before calling
 * `regularize()` for an unknown verb.
 *
 * Only `-are` verbs whose stem doesn't trigger orthographic exceptions
 * (–care, –gare, –ciare/–giare/–iare) pass — those are reliably regular.
 * `-ere` and `-ire` verbs in Italian have so many irregulars (chiedere →
 * chiesto, leggere → letto, capire → -isc-, …) that auto-deriving them is
 * a correctness risk; let those come from the irregular database
 * (`data/seedVerbs.lookupIrregular`) or stay as translation cards.
 *
 * Pure heuristic. False negatives (skipping a verb that *was* regular) just
 * mean the verb stays in translation mode — annoying but never wrong.
 */
export function isSafeRegular(infinitive: string): boolean {
  const c = classify(infinitive.trim().toLowerCase());
  if (!c) return false;
  if (c.cls !== "are") return false; // be conservative: only -are
  const last = c.stem.slice(-1);
  // Orthographic stem-changers we don't handle:
  //   -care/-gare insert h before -i suffixes (cerco, cerchi, …)
  //   -iare drops the i (mangi, mangi, mangia, mangiamo, …)
  if (last === "c" || last === "g" || last === "i") return false;
  return true;
}

/**
 * Build a full ConjugationTable for a regular `-are` verb across every tense
 * `regularize()` supports. Returns `null` if the verb isn't safe to derive
 * (caller should fall back to the irregular database or skip).
 *
 * Used by the dynamic-conjugation engine in lib/srs/conjugation.ts so a verb
 * card with no `conj` table can still be drilled in coniugazione mode.
 */
export function buildRegularTable(
  infinitive: string,
  aux: Auxiliary = "avere",
): import("./types").ConjugationTable | null {
  if (!isSafeRegular(infinitive)) return null;

  const TENSES = [
    "presente",
    "imperfetto",
    "futuro_semplice",
    "condizionale_presente",
    "passato_prossimo",
    "presente_progressivo",
    "infinito",
  ] as const;
  const PRONOUNS = ["io", "tu", "lui", "noi", "voi", "loro"] as const;

  const out: import("./types").ConjugationTable = {};
  for (const tense of TENSES) {
    const cells = regularize(infinitive, tense, aux);
    if (!cells) continue;
    const row: Record<string, string> = {};
    PRONOUNS.forEach((p, i) => {
      const v = cells[i];
      if (typeof v === "string" && v.trim() !== "") row[p] = v;
    });
    if (Object.keys(row).length > 0) out[tense] = row;
  }
  return Object.keys(out).length > 0 ? out : null;
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

  // Special "tenses" that are not built from a stem-ending pattern.
  if (tense === "infinito") {
    // Infinito has no pronoun variation. Return the bare infinitive as the io
    // cell so listFilledCells exposes exactly one prompt for this row.
    return [infinitive, "", "", "", "", ""];
  }
  if (tense === "presente_progressivo") {
    return progressiveOf(infinitive);
  }

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
