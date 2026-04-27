import { describe, test, expect } from "vitest";
import { regularize } from "@/lib/srs/regular-conjugator";

describe("regularize · -are (parlare)", () => {
  test("presente: parlo, parli, parla, parliamo, parlate, parlano", () => {
    expect(regularize("parlare", "presente")).toEqual([
      "parlo", "parli", "parla", "parliamo", "parlate", "parlano",
    ]);
  });

  test("imperfetto: parlavo, parlavi, parlava, parlavamo, parlavate, parlavano", () => {
    expect(regularize("parlare", "imperfetto")).toEqual([
      "parlavo", "parlavi", "parlava", "parlavamo", "parlavate", "parlavano",
    ]);
  });

  test("futuro_semplice: parlerò, parlerai, parlerà, parleremo, parlerete, parleranno (-are → -er stem)", () => {
    expect(regularize("parlare", "futuro_semplice")).toEqual([
      "parlerò", "parlerai", "parlerà", "parleremo", "parlerete", "parleranno",
    ]);
  });

  test("passato_prossimo with avere: ho parlato, hai parlato, …", () => {
    expect(regularize("parlare", "passato_prossimo", "avere")).toEqual([
      "ho parlato", "hai parlato", "ha parlato",
      "abbiamo parlato", "avete parlato", "hanno parlato",
    ]);
  });
});

describe("regularize · -ere (credere)", () => {
  test("presente", () => {
    expect(regularize("credere", "presente")).toEqual([
      "credo", "credi", "crede", "crediamo", "credete", "credono",
    ]);
  });

  test("imperfetto", () => {
    expect(regularize("credere", "imperfetto")).toEqual([
      "credevo", "credevi", "credeva", "credevamo", "credevate", "credevano",
    ]);
  });

  test("futuro_semplice", () => {
    expect(regularize("credere", "futuro_semplice")).toEqual([
      "crederò", "crederai", "crederà", "crederemo", "crederete", "crederanno",
    ]);
  });

  test("passato_prossimo with avere: regular participle -uto", () => {
    expect(regularize("credere", "passato_prossimo", "avere")).toEqual([
      "ho creduto", "hai creduto", "ha creduto",
      "abbiamo creduto", "avete creduto", "hanno creduto",
    ]);
  });
});

describe("regularize · -ire (partire)", () => {
  test("presente (non-isco regular)", () => {
    expect(regularize("partire", "presente")).toEqual([
      "parto", "parti", "parte", "partiamo", "partite", "partono",
    ]);
  });

  test("imperfetto", () => {
    expect(regularize("partire", "imperfetto")).toEqual([
      "partivo", "partivi", "partiva", "partivamo", "partivate", "partivano",
    ]);
  });

  test("futuro_semplice", () => {
    expect(regularize("partire", "futuro_semplice")).toEqual([
      "partirò", "partirai", "partirà", "partiremo", "partirete", "partiranno",
    ]);
  });

  test("passato_prossimo with essere: agreement masculine plural", () => {
    expect(regularize("partire", "passato_prossimo", "essere")).toEqual([
      "sono partito", "sei partito", "è partito",
      "siamo partiti", "siete partiti", "sono partiti",
    ]);
  });
});

describe("regularize · errors and edge cases", () => {
  test("returns null for non-infinitive input", () => {
    expect(regularize("hello", "presente")).toBeNull();
    expect(regularize("ciao", "presente")).toBeNull();
    expect(regularize("", "presente")).toBeNull();
  });

  test("requires aux for passato_prossimo", () => {
    expect(regularize("parlare", "passato_prossimo")).toBeNull();
  });

  test("ignores aux for non-passato_prossimo tenses", () => {
    expect(regularize("parlare", "presente", "essere")).toEqual([
      "parlo", "parli", "parla", "parliamo", "parlate", "parlano",
    ]);
  });
});
