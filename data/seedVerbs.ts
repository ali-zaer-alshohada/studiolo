import type { Card, ConjugationTable, Pronoun } from "@/lib/srs/types";
import { regularize, condizionaleFromFuturo, progressiveOf } from "@/lib/srs/regular-conjugator";

/**
 * 16 high-frequency Italian verbs with full conjugation tables for the 4
 * Phase-2 tenses (presente, passato_prossimo, imperfetto, futuro_semplice)
 * across the 6 pronouns (io, tu, lui, noi, voi, loro).
 *
 * Mix: 5 fundamental irregulars (essere, avere, andare, fare, dare),
 * 5 modals/cognitives (potere, volere, dovere, sapere, dire),
 * 4 high-frequency irregulars (stare, venire, vedere, prendere),
 * 2 regular reference verbs (parlare, capire — capire is -isco).
 *
 * Passato prossimo cells use masculine forms by default. Hand-curated; the
 * irregular ones are NOT computed from `regularize()` (their participles and
 * many stems are irregular).
 *
 * TODO(ali): expand to 25-30 verbs over time. The list below was a starting
 * point — feel free to substitute (e.g., add cognoscere, lavorare, finire,
 * scrivere, leggere, mangiare).
 */

type SeedVerb = {
  /** The infinitive (e.g., "andare"). Becomes Card.it. */
  infinitive: string;
  /** English gloss (e.g., "to go"). Becomes Card.en. */
  en: string;
  /** Full conjugation table. */
  conj: ConjugationTable;
};

// Helper: build a regular table when the verb is fully regular.
function regular(inf: string, aux: "essere" | "avere"): ConjugationTable {
  const presente = regularize(inf, "presente")!;
  const imperfetto = regularize(inf, "imperfetto")!;
  const futuro = regularize(inf, "futuro_semplice")!;
  const pp = regularize(inf, "passato_prossimo", aux)!;
  return {
    presente: pronounMap(presente),
    imperfetto: pronounMap(imperfetto),
    futuro_semplice: pronounMap(futuro),
    passato_prossimo: pronounMap(pp),
  };
}

function pronounMap(forms: string[]): Record<string, string> {
  const pronouns = ["io", "tu", "lui", "noi", "voi", "loro"] as const;
  const out: Record<string, string> = {};
  pronouns.forEach((p, i) => {
    if (forms[i] !== undefined) out[p] = forms[i] as string;
  });
  return out;
}

const SEED_VERBS: ReadonlyArray<SeedVerb> = [
  {
    infinitive: "essere",
    en: "to be",
    conj: {
      presente: { io: "sono", tu: "sei", lui: "è", noi: "siamo", voi: "siete", loro: "sono" },
      imperfetto: { io: "ero", tu: "eri", lui: "era", noi: "eravamo", voi: "eravate", loro: "erano" },
      futuro_semplice: { io: "sarò", tu: "sarai", lui: "sarà", noi: "saremo", voi: "sarete", loro: "saranno" },
      passato_prossimo: {
        io: "sono stato", tu: "sei stato", lui: "è stato",
        noi: "siamo stati", voi: "siete stati", loro: "sono stati",
      },
    },
  },
  {
    infinitive: "avere",
    en: "to have",
    conj: {
      presente: { io: "ho", tu: "hai", lui: "ha", noi: "abbiamo", voi: "avete", loro: "hanno" },
      imperfetto: { io: "avevo", tu: "avevi", lui: "aveva", noi: "avevamo", voi: "avevate", loro: "avevano" },
      futuro_semplice: { io: "avrò", tu: "avrai", lui: "avrà", noi: "avremo", voi: "avrete", loro: "avranno" },
      passato_prossimo: {
        io: "ho avuto", tu: "hai avuto", lui: "ha avuto",
        noi: "abbiamo avuto", voi: "avete avuto", loro: "hanno avuto",
      },
    },
  },
  {
    infinitive: "andare",
    en: "to go",
    conj: {
      presente: { io: "vado", tu: "vai", lui: "va", noi: "andiamo", voi: "andate", loro: "vanno" },
      imperfetto: { io: "andavo", tu: "andavi", lui: "andava", noi: "andavamo", voi: "andavate", loro: "andavano" },
      futuro_semplice: { io: "andrò", tu: "andrai", lui: "andrà", noi: "andremo", voi: "andrete", loro: "andranno" },
      passato_prossimo: {
        io: "sono andato", tu: "sei andato", lui: "è andato",
        noi: "siamo andati", voi: "siete andati", loro: "sono andati",
      },
    },
  },
  {
    infinitive: "fare",
    en: "to do · to make",
    conj: {
      presente: { io: "faccio", tu: "fai", lui: "fa", noi: "facciamo", voi: "fate", loro: "fanno" },
      imperfetto: { io: "facevo", tu: "facevi", lui: "faceva", noi: "facevamo", voi: "facevate", loro: "facevano" },
      futuro_semplice: { io: "farò", tu: "farai", lui: "farà", noi: "faremo", voi: "farete", loro: "faranno" },
      passato_prossimo: {
        io: "ho fatto", tu: "hai fatto", lui: "ha fatto",
        noi: "abbiamo fatto", voi: "avete fatto", loro: "hanno fatto",
      },
    },
  },
  {
    infinitive: "dare",
    en: "to give",
    conj: {
      presente: { io: "do", tu: "dai", lui: "dà", noi: "diamo", voi: "date", loro: "danno" },
      imperfetto: { io: "davo", tu: "davi", lui: "dava", noi: "davamo", voi: "davate", loro: "davano" },
      futuro_semplice: { io: "darò", tu: "darai", lui: "darà", noi: "daremo", voi: "darete", loro: "daranno" },
      passato_prossimo: {
        io: "ho dato", tu: "hai dato", lui: "ha dato",
        noi: "abbiamo dato", voi: "avete dato", loro: "hanno dato",
      },
    },
  },
  {
    infinitive: "stare",
    en: "to stay · to be (state)",
    conj: {
      presente: { io: "sto", tu: "stai", lui: "sta", noi: "stiamo", voi: "state", loro: "stanno" },
      imperfetto: { io: "stavo", tu: "stavi", lui: "stava", noi: "stavamo", voi: "stavate", loro: "stavano" },
      futuro_semplice: { io: "starò", tu: "starai", lui: "starà", noi: "staremo", voi: "starete", loro: "staranno" },
      passato_prossimo: {
        io: "sono stato", tu: "sei stato", lui: "è stato",
        noi: "siamo stati", voi: "siete stati", loro: "sono stati",
      },
    },
  },
  {
    infinitive: "venire",
    en: "to come",
    conj: {
      presente: { io: "vengo", tu: "vieni", lui: "viene", noi: "veniamo", voi: "venite", loro: "vengono" },
      imperfetto: { io: "venivo", tu: "venivi", lui: "veniva", noi: "venivamo", voi: "venivate", loro: "venivano" },
      futuro_semplice: { io: "verrò", tu: "verrai", lui: "verrà", noi: "verremo", voi: "verrete", loro: "verranno" },
      passato_prossimo: {
        io: "sono venuto", tu: "sei venuto", lui: "è venuto",
        noi: "siamo venuti", voi: "siete venuti", loro: "sono venuti",
      },
    },
  },
  {
    infinitive: "dire",
    en: "to say · to tell",
    conj: {
      presente: { io: "dico", tu: "dici", lui: "dice", noi: "diciamo", voi: "dite", loro: "dicono" },
      imperfetto: { io: "dicevo", tu: "dicevi", lui: "diceva", noi: "dicevamo", voi: "dicevate", loro: "dicevano" },
      futuro_semplice: { io: "dirò", tu: "dirai", lui: "dirà", noi: "diremo", voi: "direte", loro: "diranno" },
      passato_prossimo: {
        io: "ho detto", tu: "hai detto", lui: "ha detto",
        noi: "abbiamo detto", voi: "avete detto", loro: "hanno detto",
      },
    },
  },
  {
    infinitive: "potere",
    en: "to be able · can",
    conj: {
      presente: { io: "posso", tu: "puoi", lui: "può", noi: "possiamo", voi: "potete", loro: "possono" },
      imperfetto: { io: "potevo", tu: "potevi", lui: "poteva", noi: "potevamo", voi: "potevate", loro: "potevano" },
      futuro_semplice: { io: "potrò", tu: "potrai", lui: "potrà", noi: "potremo", voi: "potrete", loro: "potranno" },
      passato_prossimo: {
        io: "ho potuto", tu: "hai potuto", lui: "ha potuto",
        noi: "abbiamo potuto", voi: "avete potuto", loro: "hanno potuto",
      },
    },
  },
  {
    infinitive: "volere",
    en: "to want",
    conj: {
      presente: { io: "voglio", tu: "vuoi", lui: "vuole", noi: "vogliamo", voi: "volete", loro: "vogliono" },
      imperfetto: { io: "volevo", tu: "volevi", lui: "voleva", noi: "volevamo", voi: "volevate", loro: "volevano" },
      futuro_semplice: { io: "vorrò", tu: "vorrai", lui: "vorrà", noi: "vorremo", voi: "vorrete", loro: "vorranno" },
      passato_prossimo: {
        io: "ho voluto", tu: "hai voluto", lui: "ha voluto",
        noi: "abbiamo voluto", voi: "avete voluto", loro: "hanno voluto",
      },
    },
  },
  {
    infinitive: "dovere",
    en: "to have to · must",
    conj: {
      presente: { io: "devo", tu: "devi", lui: "deve", noi: "dobbiamo", voi: "dovete", loro: "devono" },
      imperfetto: { io: "dovevo", tu: "dovevi", lui: "doveva", noi: "dovevamo", voi: "dovevate", loro: "dovevano" },
      futuro_semplice: { io: "dovrò", tu: "dovrai", lui: "dovrà", noi: "dovremo", voi: "dovrete", loro: "dovranno" },
      passato_prossimo: {
        io: "ho dovuto", tu: "hai dovuto", lui: "ha dovuto",
        noi: "abbiamo dovuto", voi: "avete dovuto", loro: "hanno dovuto",
      },
    },
  },
  {
    infinitive: "sapere",
    en: "to know (a fact)",
    conj: {
      presente: { io: "so", tu: "sai", lui: "sa", noi: "sappiamo", voi: "sapete", loro: "sanno" },
      imperfetto: { io: "sapevo", tu: "sapevi", lui: "sapeva", noi: "sapevamo", voi: "sapevate", loro: "sapevano" },
      futuro_semplice: { io: "saprò", tu: "saprai", lui: "saprà", noi: "sapremo", voi: "saprete", loro: "sapranno" },
      passato_prossimo: {
        io: "ho saputo", tu: "hai saputo", lui: "ha saputo",
        noi: "abbiamo saputo", voi: "avete saputo", loro: "hanno saputo",
      },
    },
  },
  {
    infinitive: "vedere",
    en: "to see",
    conj: {
      presente: { io: "vedo", tu: "vedi", lui: "vede", noi: "vediamo", voi: "vedete", loro: "vedono" },
      imperfetto: { io: "vedevo", tu: "vedevi", lui: "vedeva", noi: "vedevamo", voi: "vedevate", loro: "vedevano" },
      futuro_semplice: { io: "vedrò", tu: "vedrai", lui: "vedrà", noi: "vedremo", voi: "vedrete", loro: "vedranno" },
      passato_prossimo: {
        io: "ho visto", tu: "hai visto", lui: "ha visto",
        noi: "abbiamo visto", voi: "avete visto", loro: "hanno visto",
      },
    },
  },
  {
    infinitive: "prendere",
    en: "to take",
    conj: {
      presente: { io: "prendo", tu: "prendi", lui: "prende", noi: "prendiamo", voi: "prendete", loro: "prendono" },
      imperfetto: { io: "prendevo", tu: "prendevi", lui: "prendeva", noi: "prendevamo", voi: "prendevate", loro: "prendevano" },
      futuro_semplice: { io: "prenderò", tu: "prenderai", lui: "prenderà", noi: "prenderemo", voi: "prenderete", loro: "prenderanno" },
      passato_prossimo: {
        io: "ho preso", tu: "hai preso", lui: "ha preso",
        noi: "abbiamo preso", voi: "avete preso", loro: "hanno preso",
      },
    },
  },
  {
    infinitive: "parlare",
    en: "to speak",
    conj: regular("parlare", "avere"),
  },
  {
    infinitive: "capire",
    en: "to understand",
    // Note: capire is an -isco verb in presente. Hand-overriding.
    conj: {
      presente: { io: "capisco", tu: "capisci", lui: "capisce", noi: "capiamo", voi: "capite", loro: "capiscono" },
      imperfetto: { io: "capivo", tu: "capivi", lui: "capiva", noi: "capivamo", voi: "capivate", loro: "capivano" },
      futuro_semplice: { io: "capirò", tu: "capirai", lui: "capirà", noi: "capiremo", voi: "capirete", loro: "capiranno" },
      passato_prossimo: {
        io: "ho capito", tu: "hai capito", lui: "ha capito",
        noi: "abbiamo capito", voi: "avete capito", loro: "hanno capito",
      },
    },
  },
];

/**
 * Augment a hand-curated ConjugationTable with the three derivable tenses:
 *   - infinito (just the infinitive on the io cell — no pronoun variation)
 *   - condizionale_presente (from the futuro_semplice io-form stem)
 *   - presente_progressivo (stare + gerundio)
 *
 * If a tense is already present in the table, leave it alone (so hand-curated
 * irregulars override the auto-derivation).
 */
function autoFill(infinitive: string, conj: ConjugationTable): ConjugationTable {
  const filled: ConjugationTable = { ...conj };

  if (!filled.infinito) {
    filled.infinito = { io: infinitive };
  }

  if (!filled.condizionale_presente && filled.futuro_semplice?.io) {
    const cond = condizionaleFromFuturo(filled.futuro_semplice.io);
    if (cond) {
      const pronouns: Pronoun[] = ["io", "tu", "lui", "noi", "voi", "loro"];
      const row: Partial<Record<Pronoun, string>> = {};
      pronouns.forEach((p, idx) => {
        if (cond[idx]) row[p] = cond[idx]!;
      });
      filled.condizionale_presente = row;
    }
  }

  if (!filled.presente_progressivo) {
    const prog = progressiveOf(infinitive);
    if (prog) {
      const pronouns: Pronoun[] = ["io", "tu", "lui", "noi", "voi", "loro"];
      const row: Partial<Record<Pronoun, string>> = {};
      pronouns.forEach((p, idx) => {
        if (prog[idx]) row[p] = prog[idx]!;
      });
      filled.presente_progressivo = row;
    }
  }

  return filled;
}

/** Build verb-conjugation Card[] for seeding. */
export function makeAllSeedVerbs(now: number = Date.now()): Card[] {
  return SEED_VERBS.map((sv, i) => ({
    id: `seed-verb-${i.toString(36)}-${now.toString(36)}`,
    en: sv.en,
    it: sv.infinitive,
    cat: "verbo" as const,
    rung: 0,
    due: now - i, // small jitter
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: now,
    conj: autoFill(sv.infinitive, sv.conj),
  }));
}

export const SEED_VERB_COUNT = SEED_VERBS.length;
