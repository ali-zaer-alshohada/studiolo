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
  // ─── 27 additions, 2026-05-03 — high-frequency irregulars from Ali's deck.
  // Generated via the AI prompt in scripts/import-cards workflow; spot-checked
  // for correct irregular participles (letto, scritto, chiesto, risposto,
  // chiuso, aperto, perso, vinto, speso, vissuto, messo, conosciuto, corso,
  // bevuto), correct passato-prossimo auxiliaries (uscire/tornare/entrare/
  // cadere take essere; the rest take avere), and orthographic exceptions for
  // -care/-gare/-iare (cerco/cerchi, pago/paghi, mangio/mangi, mangerò).
  {
    infinitive: "conoscere",
    en: "to know (a person)",
    conj: {
      presente: { io: "conosco", tu: "conosci", lui: "conosce", noi: "conosciamo", voi: "conoscete", loro: "conoscono" },
      imperfetto: { io: "conoscevo", tu: "conoscevi", lui: "conosceva", noi: "conoscevamo", voi: "conoscevate", loro: "conoscevano" },
      passato_prossimo: { io: "ho conosciuto", tu: "hai conosciuto", lui: "ha conosciuto", noi: "abbiamo conosciuto", voi: "avete conosciuto", loro: "hanno conosciuto" },
      futuro_semplice: { io: "conoscerò", tu: "conoscerai", lui: "conoscerà", noi: "conosceremo", voi: "conoscerete", loro: "conosceranno" },
      condizionale_presente: { io: "conoscerei", tu: "conosceresti", lui: "conoscerebbe", noi: "conosceremmo", voi: "conoscereste", loro: "conoscerebbero" },
      presente_progressivo: { io: "sto conoscendo", tu: "stai conoscendo", lui: "sta conoscendo", noi: "stiamo conoscendo", voi: "state conoscendo", loro: "stanno conoscendo" },
      infinito: { io: "conoscere" },
    },
  },
  {
    infinitive: "chiedere",
    en: "to ask",
    conj: {
      presente: { io: "chiedo", tu: "chiedi", lui: "chiede", noi: "chiediamo", voi: "chiedete", loro: "chiedono" },
      imperfetto: { io: "chiedevo", tu: "chiedevi", lui: "chiedeva", noi: "chiedevamo", voi: "chiedevate", loro: "chiedevano" },
      passato_prossimo: { io: "ho chiesto", tu: "hai chiesto", lui: "ha chiesto", noi: "abbiamo chiesto", voi: "avete chiesto", loro: "hanno chiesto" },
      futuro_semplice: { io: "chiederò", tu: "chiederai", lui: "chiederà", noi: "chiederemo", voi: "chiederete", loro: "chiederanno" },
      condizionale_presente: { io: "chiederei", tu: "chiederesti", lui: "chiederebbe", noi: "chiederemmo", voi: "chiedereste", loro: "chiederebbero" },
      presente_progressivo: { io: "sto chiedendo", tu: "stai chiedendo", lui: "sta chiedendo", noi: "stiamo chiedendo", voi: "state chiedendo", loro: "stanno chiedendo" },
      infinito: { io: "chiedere" },
    },
  },
  {
    infinitive: "rispondere",
    en: "to answer",
    conj: {
      presente: { io: "rispondo", tu: "rispondi", lui: "risponde", noi: "rispondiamo", voi: "rispondete", loro: "rispondono" },
      imperfetto: { io: "rispondevo", tu: "rispondevi", lui: "rispondeva", noi: "rispondevamo", voi: "rispondevate", loro: "rispondevano" },
      passato_prossimo: { io: "ho risposto", tu: "hai risposto", lui: "ha risposto", noi: "abbiamo risposto", voi: "avete risposto", loro: "hanno risposto" },
      futuro_semplice: { io: "risponderò", tu: "risponderai", lui: "risponderà", noi: "risponderemo", voi: "risponderete", loro: "risponderanno" },
      condizionale_presente: { io: "risponderei", tu: "risponderesti", lui: "risponderebbe", noi: "risponderemmo", voi: "rispondereste", loro: "risponderebbero" },
      presente_progressivo: { io: "sto rispondendo", tu: "stai rispondendo", lui: "sta rispondendo", noi: "stiamo rispondendo", voi: "state rispondendo", loro: "stanno rispondendo" },
      infinito: { io: "rispondere" },
    },
  },
  {
    infinitive: "leggere",
    en: "to read",
    conj: {
      presente: { io: "leggo", tu: "leggi", lui: "legge", noi: "leggiamo", voi: "leggete", loro: "leggono" },
      imperfetto: { io: "leggevo", tu: "leggevi", lui: "leggeva", noi: "leggevamo", voi: "leggevate", loro: "leggevano" },
      passato_prossimo: { io: "ho letto", tu: "hai letto", lui: "ha letto", noi: "abbiamo letto", voi: "avete letto", loro: "hanno letto" },
      futuro_semplice: { io: "leggerò", tu: "leggerai", lui: "leggerà", noi: "leggeremo", voi: "leggerete", loro: "leggeranno" },
      condizionale_presente: { io: "leggerei", tu: "leggeresti", lui: "leggerebbe", noi: "leggeremmo", voi: "leggereste", loro: "leggerebbero" },
      presente_progressivo: { io: "sto leggendo", tu: "stai leggendo", lui: "sta leggendo", noi: "stiamo leggendo", voi: "state leggendo", loro: "stanno leggendo" },
      infinito: { io: "leggere" },
    },
  },
  {
    infinitive: "scrivere",
    en: "to write",
    conj: {
      presente: { io: "scrivo", tu: "scrivi", lui: "scrive", noi: "scriviamo", voi: "scrivete", loro: "scrivono" },
      imperfetto: { io: "scrivevo", tu: "scrivevi", lui: "scriveva", noi: "scrivevamo", voi: "scrivevate", loro: "scrivevano" },
      passato_prossimo: { io: "ho scritto", tu: "hai scritto", lui: "ha scritto", noi: "abbiamo scritto", voi: "avete scritto", loro: "hanno scritto" },
      futuro_semplice: { io: "scriverò", tu: "scriverai", lui: "scriverà", noi: "scriveremo", voi: "scriverete", loro: "scriveranno" },
      condizionale_presente: { io: "scriverei", tu: "scriveresti", lui: "scriverebbe", noi: "scriveremmo", voi: "scrivereste", loro: "scriverebbero" },
      presente_progressivo: { io: "sto scrivendo", tu: "stai scrivendo", lui: "sta scrivendo", noi: "stiamo scrivendo", voi: "state scrivendo", loro: "stanno scrivendo" },
      infinito: { io: "scrivere" },
    },
  },
  {
    infinitive: "credere",
    en: "to believe",
    conj: {
      presente: { io: "credo", tu: "credi", lui: "crede", noi: "crediamo", voi: "credete", loro: "credono" },
      imperfetto: { io: "credevo", tu: "credevi", lui: "credeva", noi: "credevamo", voi: "credevate", loro: "credevano" },
      passato_prossimo: { io: "ho creduto", tu: "hai creduto", lui: "ha creduto", noi: "abbiamo creduto", voi: "avete creduto", loro: "hanno creduto" },
      futuro_semplice: { io: "crederò", tu: "crederai", lui: "crederà", noi: "crederemo", voi: "crederete", loro: "crederanno" },
      condizionale_presente: { io: "crederei", tu: "crederesti", lui: "crederebbe", noi: "crederemmo", voi: "credereste", loro: "crederebbero" },
      presente_progressivo: { io: "sto credendo", tu: "stai credendo", lui: "sta credendo", noi: "stiamo credendo", voi: "state credendo", loro: "stanno credendo" },
      infinito: { io: "credere" },
    },
  },
  {
    infinitive: "perdere",
    en: "to lose",
    conj: {
      presente: { io: "perdo", tu: "perdi", lui: "perde", noi: "perdiamo", voi: "perdete", loro: "perdono" },
      imperfetto: { io: "perdevo", tu: "perdevi", lui: "perdeva", noi: "perdevamo", voi: "perdevate", loro: "perdevano" },
      passato_prossimo: { io: "ho perso", tu: "hai perso", lui: "ha perso", noi: "abbiamo perso", voi: "avete perso", loro: "hanno perso" },
      futuro_semplice: { io: "perderò", tu: "perderai", lui: "perderà", noi: "perderemo", voi: "perderete", loro: "perderanno" },
      condizionale_presente: { io: "perderei", tu: "perderesti", lui: "perderebbe", noi: "perderemmo", voi: "perdereste", loro: "perderebbero" },
      presente_progressivo: { io: "sto perdendo", tu: "stai perdendo", lui: "sta perdendo", noi: "stiamo perdendo", voi: "state perdendo", loro: "stanno perdendo" },
      infinito: { io: "perdere" },
    },
  },
  {
    infinitive: "vincere",
    en: "to win",
    conj: {
      presente: { io: "vinco", tu: "vinci", lui: "vince", noi: "vinciamo", voi: "vincete", loro: "vincono" },
      imperfetto: { io: "vincevo", tu: "vincevi", lui: "vinceva", noi: "vincevamo", voi: "vincevate", loro: "vincevano" },
      passato_prossimo: { io: "ho vinto", tu: "hai vinto", lui: "ha vinto", noi: "abbiamo vinto", voi: "avete vinto", loro: "hanno vinto" },
      futuro_semplice: { io: "vincerò", tu: "vincerai", lui: "vincerà", noi: "vinceremo", voi: "vincerete", loro: "vinceranno" },
      condizionale_presente: { io: "vincerei", tu: "vinceresti", lui: "vincerebbe", noi: "vinceremmo", voi: "vincereste", loro: "vincerebbero" },
      presente_progressivo: { io: "sto vincendo", tu: "stai vincendo", lui: "sta vincendo", noi: "stiamo vincendo", voi: "state vincendo", loro: "stanno vincendo" },
      infinito: { io: "vincere" },
    },
  },
  {
    infinitive: "ricevere",
    en: "to receive",
    conj: {
      presente: { io: "ricevo", tu: "ricevi", lui: "riceve", noi: "riceviamo", voi: "ricevete", loro: "ricevono" },
      imperfetto: { io: "ricevevo", tu: "ricevevi", lui: "riceveva", noi: "ricevevamo", voi: "ricevevate", loro: "ricevevano" },
      passato_prossimo: { io: "ho ricevuto", tu: "hai ricevuto", lui: "ha ricevuto", noi: "abbiamo ricevuto", voi: "avete ricevuto", loro: "hanno ricevuto" },
      futuro_semplice: { io: "riceverò", tu: "riceverai", lui: "riceverà", noi: "riceveremo", voi: "riceverete", loro: "riceveranno" },
      condizionale_presente: { io: "riceverei", tu: "riceveresti", lui: "riceverebbe", noi: "riceveremmo", voi: "ricevereste", loro: "riceverebbero" },
      presente_progressivo: { io: "sto ricevendo", tu: "stai ricevendo", lui: "sta ricevendo", noi: "stiamo ricevendo", voi: "state ricevendo", loro: "stanno ricevendo" },
      infinito: { io: "ricevere" },
    },
  },
  {
    infinitive: "vendere",
    en: "to sell",
    conj: {
      presente: { io: "vendo", tu: "vendi", lui: "vende", noi: "vendiamo", voi: "vendete", loro: "vendono" },
      imperfetto: { io: "vendevo", tu: "vendevi", lui: "vendeva", noi: "vendevamo", voi: "vendevate", loro: "vendevano" },
      passato_prossimo: { io: "ho venduto", tu: "hai venduto", lui: "ha venduto", noi: "abbiamo venduto", voi: "avete venduto", loro: "hanno venduto" },
      futuro_semplice: { io: "venderò", tu: "venderai", lui: "venderà", noi: "venderemo", voi: "venderete", loro: "venderanno" },
      condizionale_presente: { io: "venderei", tu: "venderesti", lui: "venderebbe", noi: "venderemmo", voi: "vendereste", loro: "venderebbero" },
      presente_progressivo: { io: "sto vendendo", tu: "stai vendendo", lui: "sta vendendo", noi: "stiamo vendendo", voi: "state vendendo", loro: "stanno vendendo" },
      infinito: { io: "vendere" },
    },
  },
  {
    infinitive: "spendere",
    en: "to spend (money)",
    conj: {
      presente: { io: "spendo", tu: "spendi", lui: "spende", noi: "spendiamo", voi: "spendete", loro: "spendono" },
      imperfetto: { io: "spendevo", tu: "spendevi", lui: "spendeva", noi: "spendevamo", voi: "spendevate", loro: "spendevano" },
      passato_prossimo: { io: "ho speso", tu: "hai speso", lui: "ha speso", noi: "abbiamo speso", voi: "avete speso", loro: "hanno speso" },
      futuro_semplice: { io: "spenderò", tu: "spenderai", lui: "spenderà", noi: "spenderemo", voi: "spenderete", loro: "spenderanno" },
      condizionale_presente: { io: "spenderei", tu: "spenderesti", lui: "spenderebbe", noi: "spenderemmo", voi: "spendereste", loro: "spenderebbero" },
      presente_progressivo: { io: "sto spendendo", tu: "stai spendendo", lui: "sta spendendo", noi: "stiamo spendendo", voi: "state spendendo", loro: "stanno spendendo" },
      infinito: { io: "spendere" },
    },
  },
  {
    infinitive: "bere",
    en: "to drink",
    conj: {
      presente: { io: "bevo", tu: "bevi", lui: "beve", noi: "beviamo", voi: "bevete", loro: "bevono" },
      imperfetto: { io: "bevevo", tu: "bevevi", lui: "beveva", noi: "bevevamo", voi: "bevevate", loro: "bevevano" },
      passato_prossimo: { io: "ho bevuto", tu: "hai bevuto", lui: "ha bevuto", noi: "abbiamo bevuto", voi: "avete bevuto", loro: "hanno bevuto" },
      futuro_semplice: { io: "berrò", tu: "berrai", lui: "berrà", noi: "berremo", voi: "berrete", loro: "berranno" },
      condizionale_presente: { io: "berrei", tu: "berresti", lui: "berrebbe", noi: "berremmo", voi: "berreste", loro: "berrebbero" },
      presente_progressivo: { io: "sto bevendo", tu: "stai bevendo", lui: "sta bevendo", noi: "stiamo bevendo", voi: "state bevendo", loro: "stanno bevendo" },
      infinito: { io: "bere" },
    },
  },
  {
    infinitive: "chiudere",
    en: "to close",
    conj: {
      presente: { io: "chiudo", tu: "chiudi", lui: "chiude", noi: "chiudiamo", voi: "chiudete", loro: "chiudono" },
      imperfetto: { io: "chiudevo", tu: "chiudevi", lui: "chiudeva", noi: "chiudevamo", voi: "chiudevate", loro: "chiudevano" },
      passato_prossimo: { io: "ho chiuso", tu: "hai chiuso", lui: "ha chiuso", noi: "abbiamo chiuso", voi: "avete chiuso", loro: "hanno chiuso" },
      futuro_semplice: { io: "chiuderò", tu: "chiuderai", lui: "chiuderà", noi: "chiuderemo", voi: "chiuderete", loro: "chiuderanno" },
      condizionale_presente: { io: "chiuderei", tu: "chiuderesti", lui: "chiuderebbe", noi: "chiuderemmo", voi: "chiudereste", loro: "chiuderebbero" },
      presente_progressivo: { io: "sto chiudendo", tu: "stai chiudendo", lui: "sta chiudendo", noi: "stiamo chiudendo", voi: "state chiudendo", loro: "stanno chiudendo" },
      infinito: { io: "chiudere" },
    },
  },
  {
    infinitive: "aprire",
    en: "to open",
    conj: {
      presente: { io: "apro", tu: "apri", lui: "apre", noi: "apriamo", voi: "aprite", loro: "aprono" },
      imperfetto: { io: "aprivo", tu: "aprivi", lui: "apriva", noi: "aprivamo", voi: "aprivate", loro: "aprivano" },
      passato_prossimo: { io: "ho aperto", tu: "hai aperto", lui: "ha aperto", noi: "abbiamo aperto", voi: "avete aperto", loro: "hanno aperto" },
      futuro_semplice: { io: "aprirò", tu: "aprirai", lui: "aprirà", noi: "apriremo", voi: "aprirete", loro: "apriranno" },
      condizionale_presente: { io: "aprirei", tu: "apriresti", lui: "aprirebbe", noi: "apriremmo", voi: "aprireste", loro: "aprirebbero" },
      presente_progressivo: { io: "sto aprendo", tu: "stai aprendo", lui: "sta aprendo", noi: "stiamo aprendo", voi: "state aprendo", loro: "stanno aprendo" },
      infinito: { io: "aprire" },
    },
  },
  {
    infinitive: "uscire",
    en: "to go out",
    conj: {
      presente: { io: "esco", tu: "esci", lui: "esce", noi: "usciamo", voi: "uscite", loro: "escono" },
      imperfetto: { io: "uscivo", tu: "uscivi", lui: "usciva", noi: "uscivamo", voi: "uscivate", loro: "uscivano" },
      passato_prossimo: { io: "sono uscito", tu: "sei uscito", lui: "è uscito", noi: "siamo usciti", voi: "siete usciti", loro: "sono usciti" },
      futuro_semplice: { io: "uscirò", tu: "uscirai", lui: "uscirà", noi: "usciremo", voi: "uscirete", loro: "usciranno" },
      condizionale_presente: { io: "uscirei", tu: "usciresti", lui: "uscirebbe", noi: "usciremmo", voi: "uscireste", loro: "uscirebbero" },
      presente_progressivo: { io: "sto uscendo", tu: "stai uscendo", lui: "sta uscendo", noi: "stiamo uscendo", voi: "state uscendo", loro: "stanno uscendo" },
      infinito: { io: "uscire" },
    },
  },
  {
    infinitive: "tornare",
    en: "to return",
    conj: {
      presente: { io: "torno", tu: "torni", lui: "torna", noi: "torniamo", voi: "tornate", loro: "tornano" },
      imperfetto: { io: "tornavo", tu: "tornavi", lui: "tornava", noi: "tornavamo", voi: "tornavate", loro: "tornavano" },
      passato_prossimo: { io: "sono tornato", tu: "sei tornato", lui: "è tornato", noi: "siamo tornati", voi: "siete tornati", loro: "sono tornati" },
      futuro_semplice: { io: "tornerò", tu: "tornerai", lui: "tornerà", noi: "torneremo", voi: "tornerete", loro: "torneranno" },
      condizionale_presente: { io: "tornerei", tu: "torneresti", lui: "tornerebbe", noi: "torneremmo", voi: "tornereste", loro: "tornerebbero" },
      presente_progressivo: { io: "sto tornando", tu: "stai tornando", lui: "sta tornando", noi: "stiamo tornando", voi: "state tornando", loro: "stanno tornando" },
      infinito: { io: "tornare" },
    },
  },
  {
    infinitive: "entrare",
    en: "to enter",
    conj: {
      presente: { io: "entro", tu: "entri", lui: "entra", noi: "entriamo", voi: "entrate", loro: "entrano" },
      imperfetto: { io: "entravo", tu: "entravi", lui: "entrava", noi: "entravamo", voi: "entravate", loro: "entravano" },
      passato_prossimo: { io: "sono entrato", tu: "sei entrato", lui: "è entrato", noi: "siamo entrati", voi: "siete entrati", loro: "sono entrati" },
      futuro_semplice: { io: "entrerò", tu: "entrerai", lui: "entrerà", noi: "entreremo", voi: "entrerete", loro: "entreranno" },
      condizionale_presente: { io: "entrerei", tu: "entreresti", lui: "entrerebbe", noi: "entreremmo", voi: "entrereste", loro: "entrerebbero" },
      presente_progressivo: { io: "sto entrando", tu: "stai entrando", lui: "sta entrando", noi: "stiamo entrando", voi: "state entrando", loro: "stanno entrando" },
      infinito: { io: "entrare" },
    },
  },
  {
    infinitive: "cadere",
    en: "to fall",
    conj: {
      presente: { io: "cado", tu: "cadi", lui: "cade", noi: "cadiamo", voi: "cadete", loro: "cadono" },
      imperfetto: { io: "cadevo", tu: "cadevi", lui: "cadeva", noi: "cadevamo", voi: "cadevate", loro: "cadevano" },
      passato_prossimo: { io: "sono caduto", tu: "sei caduto", lui: "è caduto", noi: "siamo caduti", voi: "siete caduti", loro: "sono caduti" },
      futuro_semplice: { io: "cadrò", tu: "cadrai", lui: "cadrà", noi: "cadremo", voi: "cadrete", loro: "cadranno" },
      condizionale_presente: { io: "cadrei", tu: "cadresti", lui: "cadrebbe", noi: "cadremmo", voi: "cadreste", loro: "cadrebbero" },
      presente_progressivo: { io: "sto cadendo", tu: "stai cadendo", lui: "sta cadendo", noi: "stiamo cadendo", voi: "state cadendo", loro: "stanno cadendo" },
      infinito: { io: "cadere" },
    },
  },
  {
    infinitive: "correre",
    en: "to run",
    conj: {
      presente: { io: "corro", tu: "corri", lui: "corre", noi: "corriamo", voi: "correte", loro: "corrono" },
      imperfetto: { io: "correvo", tu: "correvi", lui: "correva", noi: "correvamo", voi: "correvate", loro: "correvano" },
      passato_prossimo: { io: "ho corso", tu: "hai corso", lui: "ha corso", noi: "abbiamo corso", voi: "avete corso", loro: "hanno corso" },
      futuro_semplice: { io: "correrò", tu: "correrai", lui: "correrà", noi: "correremo", voi: "correrete", loro: "correranno" },
      condizionale_presente: { io: "correrei", tu: "correresti", lui: "correrebbe", noi: "correremmo", voi: "correreste", loro: "correrebbero" },
      presente_progressivo: { io: "sto correndo", tu: "stai correndo", lui: "sta correndo", noi: "stiamo correndo", voi: "state correndo", loro: "stanno correndo" },
      infinito: { io: "correre" },
    },
  },
  {
    infinitive: "mettere",
    en: "to put",
    conj: {
      presente: { io: "metto", tu: "metti", lui: "mette", noi: "mettiamo", voi: "mettete", loro: "mettono" },
      imperfetto: { io: "mettevo", tu: "mettevi", lui: "metteva", noi: "mettevamo", voi: "mettevate", loro: "mettevano" },
      passato_prossimo: { io: "ho messo", tu: "hai messo", lui: "ha messo", noi: "abbiamo messo", voi: "avete messo", loro: "hanno messo" },
      futuro_semplice: { io: "metterò", tu: "metterai", lui: "metterà", noi: "metteremo", voi: "metterete", loro: "metteranno" },
      condizionale_presente: { io: "metterei", tu: "metteresti", lui: "metterebbe", noi: "metteremmo", voi: "mettereste", loro: "metterebbero" },
      presente_progressivo: { io: "sto mettendo", tu: "stai mettendo", lui: "sta mettendo", noi: "stiamo mettendo", voi: "state mettendo", loro: "stanno mettendo" },
      infinito: { io: "mettere" },
    },
  },
  {
    infinitive: "vivere",
    en: "to live",
    conj: {
      presente: { io: "vivo", tu: "vivi", lui: "vive", noi: "viviamo", voi: "vivete", loro: "vivono" },
      imperfetto: { io: "vivevo", tu: "vivevi", lui: "viveva", noi: "vivevamo", voi: "vivevate", loro: "vivevano" },
      passato_prossimo: { io: "ho vissuto", tu: "hai vissuto", lui: "ha vissuto", noi: "abbiamo vissuto", voi: "avete vissuto", loro: "hanno vissuto" },
      futuro_semplice: { io: "vivrò", tu: "vivrai", lui: "vivrà", noi: "vivremo", voi: "vivrete", loro: "vivranno" },
      condizionale_presente: { io: "vivrei", tu: "vivresti", lui: "vivrebbe", noi: "vivremmo", voi: "vivreste", loro: "vivrebbero" },
      presente_progressivo: { io: "sto vivendo", tu: "stai vivendo", lui: "sta vivendo", noi: "stiamo vivendo", voi: "state vivendo", loro: "stanno vivendo" },
      infinito: { io: "vivere" },
    },
  },
  {
    infinitive: "mangiare",
    en: "to eat",
    conj: {
      presente: { io: "mangio", tu: "mangi", lui: "mangia", noi: "mangiamo", voi: "mangiate", loro: "mangiano" },
      imperfetto: { io: "mangiavo", tu: "mangiavi", lui: "mangiava", noi: "mangiavamo", voi: "mangiavate", loro: "mangiavano" },
      passato_prossimo: { io: "ho mangiato", tu: "hai mangiato", lui: "ha mangiato", noi: "abbiamo mangiato", voi: "avete mangiato", loro: "hanno mangiato" },
      futuro_semplice: { io: "mangerò", tu: "mangerai", lui: "mangerà", noi: "mangeremo", voi: "mangerete", loro: "mangeranno" },
      condizionale_presente: { io: "mangerei", tu: "mangeresti", lui: "mangerebbe", noi: "mangeremmo", voi: "mangereste", loro: "mangerebbero" },
      presente_progressivo: { io: "sto mangiando", tu: "stai mangiando", lui: "sta mangiando", noi: "stiamo mangiando", voi: "state mangiando", loro: "stanno mangiando" },
      infinito: { io: "mangiare" },
    },
  },
  {
    infinitive: "cucinare",
    en: "to cook",
    conj: {
      presente: { io: "cucino", tu: "cucini", lui: "cucina", noi: "cuciniamo", voi: "cucinate", loro: "cucinano" },
      imperfetto: { io: "cucinavo", tu: "cucinavi", lui: "cucinava", noi: "cucinavamo", voi: "cucinavate", loro: "cucinavano" },
      passato_prossimo: { io: "ho cucinato", tu: "hai cucinato", lui: "ha cucinato", noi: "abbiamo cucinato", voi: "avete cucinato", loro: "hanno cucinato" },
      futuro_semplice: { io: "cucinerò", tu: "cucinerai", lui: "cucinerà", noi: "cucineremo", voi: "cucinerete", loro: "cucineranno" },
      condizionale_presente: { io: "cucinerei", tu: "cucineresti", lui: "cucinerebbe", noi: "cucineremmo", voi: "cucinereste", loro: "cucinerebbero" },
      presente_progressivo: { io: "sto cucinando", tu: "stai cucinando", lui: "sta cucinando", noi: "stiamo cucinando", voi: "state cucinando", loro: "stanno cucinando" },
      infinito: { io: "cucinare" },
    },
  },
  {
    infinitive: "cercare",
    en: "to look for",
    conj: {
      presente: { io: "cerco", tu: "cerchi", lui: "cerca", noi: "cerchiamo", voi: "cercate", loro: "cercano" },
      imperfetto: { io: "cercavo", tu: "cercavi", lui: "cercava", noi: "cercavamo", voi: "cercavate", loro: "cercavano" },
      passato_prossimo: { io: "ho cercato", tu: "hai cercato", lui: "ha cercato", noi: "abbiamo cercato", voi: "avete cercato", loro: "hanno cercato" },
      futuro_semplice: { io: "cercherò", tu: "cercherai", lui: "cercherà", noi: "cercheremo", voi: "cercherete", loro: "cercheranno" },
      condizionale_presente: { io: "cercherei", tu: "cercheresti", lui: "cercherebbe", noi: "cercheremmo", voi: "cerchereste", loro: "cercherebbero" },
      presente_progressivo: { io: "sto cercando", tu: "stai cercando", lui: "sta cercando", noi: "stiamo cercando", voi: "state cercando", loro: "stanno cercando" },
      infinito: { io: "cercare" },
    },
  },
  {
    infinitive: "pagare",
    en: "to pay",
    conj: {
      presente: { io: "pago", tu: "paghi", lui: "paga", noi: "paghiamo", voi: "pagate", loro: "pagano" },
      imperfetto: { io: "pagavo", tu: "pagavi", lui: "pagava", noi: "pagavamo", voi: "pagavate", loro: "pagavano" },
      passato_prossimo: { io: "ho pagato", tu: "hai pagato", lui: "ha pagato", noi: "abbiamo pagato", voi: "avete pagato", loro: "hanno pagato" },
      futuro_semplice: { io: "pagherò", tu: "pagherai", lui: "pagherà", noi: "pagheremo", voi: "pagherete", loro: "pagheranno" },
      condizionale_presente: { io: "pagherei", tu: "pagheresti", lui: "pagherebbe", noi: "pagheremmo", voi: "paghereste", loro: "pagherebbero" },
      presente_progressivo: { io: "sto pagando", tu: "stai pagando", lui: "sta pagando", noi: "stiamo pagando", voi: "state pagando", loro: "stanno pagando" },
      infinito: { io: "pagare" },
    },
  },
  {
    infinitive: "sentire",
    en: "to hear / to feel",
    conj: {
      presente: { io: "sento", tu: "senti", lui: "sente", noi: "sentiamo", voi: "sentite", loro: "sentono" },
      imperfetto: { io: "sentivo", tu: "sentivi", lui: "sentiva", noi: "sentivamo", voi: "sentivate", loro: "sentivano" },
      passato_prossimo: { io: "ho sentito", tu: "hai sentito", lui: "ha sentito", noi: "abbiamo sentito", voi: "avete sentito", loro: "hanno sentito" },
      futuro_semplice: { io: "sentirò", tu: "sentirai", lui: "sentirà", noi: "sentiremo", voi: "sentirete", loro: "sentiranno" },
      condizionale_presente: { io: "sentirei", tu: "sentiresti", lui: "sentirebbe", noi: "sentiremmo", voi: "sentireste", loro: "sentirebbero" },
      presente_progressivo: { io: "sto sentendo", tu: "stai sentendo", lui: "sta sentendo", noi: "stiamo sentendo", voi: "state sentendo", loro: "stanno sentendo" },
      infinito: { io: "sentire" },
    },
  },
  {
    infinitive: "dormire",
    en: "to sleep",
    conj: {
      presente: { io: "dormo", tu: "dormi", lui: "dorme", noi: "dormiamo", voi: "dormite", loro: "dormono" },
      imperfetto: { io: "dormivo", tu: "dormivi", lui: "dormiva", noi: "dormivamo", voi: "dormivate", loro: "dormivano" },
      passato_prossimo: { io: "ho dormito", tu: "hai dormito", lui: "ha dormito", noi: "abbiamo dormito", voi: "avete dormito", loro: "hanno dormito" },
      futuro_semplice: { io: "dormirò", tu: "dormirai", lui: "dormirà", noi: "dormiremo", voi: "dormirete", loro: "dormiranno" },
      condizionale_presente: { io: "dormirei", tu: "dormiresti", lui: "dormirebbe", noi: "dormiremmo", voi: "dormireste", loro: "dormirebbero" },
      presente_progressivo: { io: "sto dormendo", tu: "stai dormendo", lui: "sta dormendo", noi: "stiamo dormendo", voi: "state dormendo", loro: "stanno dormendo" },
      infinito: { io: "dormire" },
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
    charge: 0,
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

/**
 * Lookup a verb's hand-curated conjugation table by its infinitive.
 * Returns null if the verb isn't in the seed list. Used by the
 * dynamic-conjugation engine in lib/srs/conjugation.ts to drill verbs
 * even when the user's card doesn't carry an explicit conj table.
 *
 * Note: returns the autoFill-expanded table (so condizionale_presente,
 * presente_progressivo, and infinito are all present alongside the four
 * Phase-2 tenses).
 */
export function lookupIrregular(infinitive: string): ConjugationTable | null {
  const v = infinitive.trim().toLowerCase();
  const found = SEED_VERBS.find((sv) => sv.infinitive === v);
  if (!found) return null;
  return autoFill(found.infinitive, found.conj);
}
