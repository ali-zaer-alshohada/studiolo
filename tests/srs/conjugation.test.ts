import { describe, test, expect } from "vitest";
import {
  pickConjugationPrompt,
  gradeConjugation,
  resolveConj,
  isConjugatable,
} from "@/lib/srs/conjugation";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(conj?: Card["conj"]): Card {
  return {
    id: "andare",
    en: "to go",
    it: "andare",
    cat: "verbo",
    rung: 0,
    charge: 0,
    due: NOW,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW,
    conj,
  };
}

const FULL_TABLE = {
  presente: { io: "vado", tu: "vai", lui: "va", noi: "andiamo", voi: "andate", loro: "vanno" },
  imperfetto: { io: "andavo", tu: "andavi", lui: "andava", noi: "andavamo", voi: "andavate", loro: "andavano" },
};

describe("pickConjugationPrompt", () => {
  test("returns null for a non-verb card with no conj", () => {
    // Non-verb cards never get auto-derived conj.
    const c = mkCard();
    c.cat = "sostantivo";
    c.it = "il tavolo";
    expect(pickConjugationPrompt(c)).toBeNull();
  });

  test("returns null for an empty explicit conjugation table", () => {
    // Explicit empty conj wins over derivation — caller said "no cells".
    expect(pickConjugationPrompt(mkCard({}))).toBeNull();
  });

  test("returns a prompt with tense + pronoun + expected for a populated table", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0);
    expect(p).not.toBeNull();
    expect(p?.tense).toBe("presente");
    expect(p?.pronoun).toBe("io");
    expect(p?.expected).toBe("vado");
    expect(p?.tenseLabel).toBe("presente");
    expect(p?.pronounLabel).toBe("io");
  });

  test("uses rng to pick across all filled cells", () => {
    const p1 = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0);
    const p2 = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0.99);
    expect(p1?.expected).not.toBe(p2?.expected);
  });

  test("skips empty cells in a partial table", () => {
    const partial = {
      presente: { io: "vado", tu: "" }, // tu is empty
    };
    const p = pickConjugationPrompt(mkCard(partial as Card["conj"]), () => 0.99);
    expect(p?.pronoun).toBe("io"); // never picks tu (empty)
    expect(p?.expected).toBe("vado");
  });
});

describe("resolveConj — dynamic conjugation engine", () => {
  test("returns explicit card.conj when set (no derivation)", () => {
    const c = mkCard({ presente: { io: "X" } });
    expect(resolveConj(c)?.presente?.io).toBe("X");
  });

  test("auto-derives from the irregular database (seedVerbs)", () => {
    // andare is in seedVerbs with the correct irregular forms.
    const c = mkCard();
    c.it = "andare";
    const t = resolveConj(c);
    expect(t?.presente?.io).toBe("vado");
    expect(t?.passato_prossimo?.io).toBe("sono andato");
    expect(t?.futuro_semplice?.io).toBe("andrò");
  });

  test("auto-derives a safe regular -are verb (lavorare)", () => {
    const c = mkCard();
    c.it = "lavorare";
    const t = resolveConj(c);
    expect(t?.presente?.io).toBe("lavoro");
    expect(t?.imperfetto?.io).toBe("lavoravo");
    expect(t?.futuro_semplice?.io).toBe("lavorerò");
  });

  test("rejects -iare verbs (studiare → would mangle 'studi+i')", () => {
    // studiare's stem 'studi' ends in 'i'; regularize would output "studii"
    // for the tu form. Conservative gate skips it; user can hand-curate
    // via /aggiungi/verbo if they need it conjugated.
    const c = mkCard();
    c.it = "studiare";
    expect(resolveConj(c)).toBeNull();
  });

  test("returns null for unsafe -are (orthographic exceptions: cercare)", () => {
    // -care needs an inserted h before -i suffixes (cerchi, cerchiamo).
    // regularize doesn't handle that, so we conservatively skip.
    const c = mkCard();
    c.it = "cercare";
    expect(resolveConj(c)).toBeNull();
  });

  test("returns null for unknown -ere/-ire verbs (correctness risk)", () => {
    // leggere has irregular participle (letto), not "leggiuto". Skip.
    const c = mkCard();
    c.it = "leggere";
    expect(resolveConj(c)).toBeNull();
  });

  test("returns null for non-verb cards", () => {
    const c = mkCard();
    c.cat = "sostantivo";
    c.it = "il tavolo";
    expect(resolveConj(c)).toBeNull();
  });
});

describe("isConjugatable", () => {
  test("explicit conj with cells → true", () => {
    expect(isConjugatable(mkCard(FULL_TABLE))).toBe(true);
  });

  test("verb in seedVerbs database → true (no explicit conj needed)", () => {
    const c = mkCard();
    c.it = "essere";
    expect(isConjugatable(c)).toBe(true);
  });

  test("regular -are verb → true", () => {
    const c = mkCard();
    c.it = "lavorare";
    expect(isConjugatable(c)).toBe(true);
  });

  test("unsafe -are (cercare, mangiare) → false", () => {
    const c1 = mkCard();
    c1.it = "cercare";
    expect(isConjugatable(c1)).toBe(false);
    const c2 = mkCard();
    c2.it = "mangiare";
    expect(isConjugatable(c2)).toBe(false);
  });

  test("non-verb → false", () => {
    const c = mkCard();
    c.cat = "altro";
    c.it = "comunque";
    expect(isConjugatable(c)).toBe(false);
  });
});

describe("gradeConjugation", () => {
  test("exact match → ok=true", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    expect(gradeConjugation(p, "vado").ok).toBe(true);
  });

  test("case-insensitive match", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    expect(gradeConjugation(p, "Vado").ok).toBe(true);
  });

  test("trailing punctuation forgiven", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    expect(gradeConjugation(p, "vado.").ok).toBe(true);
  });

  test("wrong form → ok=false", () => {
    const p = pickConjugationPrompt(mkCard(FULL_TABLE), () => 0)!;
    const r = gradeConjugation(p, "vai");
    expect(r.ok).toBe(false);
    expect(r.expected).toBe("vado");
    expect(r.userInput).toBe("vai");
  });
});
