import { describe, test, expect } from "vitest";
import { detectCat } from "@/lib/text/detectCat";

describe("detectCat — Italian category heuristic", () => {
  test("returns null for empty / whitespace input", () => {
    expect(detectCat("")).toBe(null);
    expect(detectCat("   ")).toBe(null);
  });

  test("recognises masculine articles → sostantivo", () => {
    expect(detectCat("il tavolo")).toBe("sostantivo");
    expect(detectCat("lo zaino")).toBe("sostantivo");
    expect(detectCat("i libri")).toBe("sostantivo");
    expect(detectCat("gli amici")).toBe("sostantivo");
    expect(detectCat("un libro")).toBe("sostantivo");
    expect(detectCat("uno specchio")).toBe("sostantivo");
  });

  test("recognises feminine articles → sostantivo", () => {
    expect(detectCat("la mano")).toBe("sostantivo");
    expect(detectCat("le mani")).toBe("sostantivo");
    expect(detectCat("una donna")).toBe("sostantivo");
  });

  test("recognises auxiliary verbs (essere, avere) → verbo", () => {
    expect(detectCat("ho mangiato")).toBe("verbo");
    expect(detectCat("hai detto")).toBe("verbo");
    expect(detectCat("è andato")).toBe("verbo");
    expect(detectCat("sono andato")).toBe("verbo");
    expect(detectCat("siamo arrivati")).toBe("verbo");
    expect(detectCat("hanno parlato")).toBe("verbo");
  });

  test("recognises infinitive endings -are/-ere/-ire → verbo", () => {
    expect(detectCat("parlare")).toBe("verbo");
    expect(detectCat("vedere")).toBe("verbo");
    expect(detectCat("partire")).toBe("verbo");
  });

  test("recognises reflexive infinitives -arsi/-ersi/-irsi → verbo", () => {
    expect(detectCat("addormentarsi")).toBe("verbo");
    expect(detectCat("perdersi")).toBe("verbo");
    expect(detectCat("vestirsi")).toBe("verbo");
  });

  test("recognises pronouns (mi, ti, si, ci, vi, ne, …) → pronome", () => {
    expect(detectCat("mi")).toBe("pronome");
    expect(detectCat("ti")).toBe("pronome");
    expect(detectCat("ne")).toBe("pronome");
    // "lo" / "la" / "le" / "gli" are ambiguous (article OR pronoun);
    // the article check runs first, so "lo zaino" → sostantivo. Bare "lo" with
    // no following noun is treated as the article (match prototype behaviour).
  });

  test("recognises common prepositions → preposizione", () => {
    expect(detectCat("di mattina")).toBe("preposizione");
    expect(detectCat("a casa")).toBe("preposizione");
    expect(detectCat("da ieri")).toBe("preposizione");
    expect(detectCat("in città")).toBe("preposizione");
    expect(detectCat("con noi")).toBe("preposizione");
    expect(detectCat("per te")).toBe("preposizione");
  });

  test("returns null when nothing matches", () => {
    expect(detectCat("bello")).toBe(null); // adjective — no rule
    expect(detectCat("lentamente")).toBe(null); // adverb — no rule
  });

  test("articles win over pronoun forms when followed by a noun", () => {
    // 'lo' is a pronoun token but at start of 'lo zaino' the article rule fires first
    expect(detectCat("lo zaino")).toBe("sostantivo");
  });

  test("trims and lowercases input before matching", () => {
    expect(detectCat("  IL TAVOLO  ")).toBe("sostantivo");
    expect(detectCat("HO mangiato")).toBe("verbo");
  });
});
