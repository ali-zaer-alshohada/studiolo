import { describe, it, expect } from "vitest";
import { suggestArticle } from "@/lib/italian/articles";

describe("suggestArticle", () => {
  it("returns null for empty input", () => {
    expect(suggestArticle("")).toBeNull();
    expect(suggestArticle("   ")).toBeNull();
  });

  describe("masculine", () => {
    it("-o ending → il + i + un", () => {
      const s = suggestArticle("libro");
      expect(s?.definite).toBe("il");
      expect(s?.definitePlural).toBe("i");
      expect(s?.indefinite).toBe("un");
      expect(s?.gender).toBe("m");
    });
    it("s+consonant → lo + gli + uno", () => {
      const s = suggestArticle("studente");
      expect(s?.definite).toBe("lo");
      expect(s?.definitePlural).toBe("gli");
      expect(s?.indefinite).toBe("uno");
    });
    it("z initial → lo + uno", () => {
      const s = suggestArticle("zaino");
      expect(s?.definite).toBe("lo");
      expect(s?.indefinite).toBe("uno");
    });
    it("ps initial → lo + uno", () => {
      const s = suggestArticle("psicologo");
      expect(s?.definite).toBe("lo");
      expect(s?.indefinite).toBe("uno");
    });
    it("gn initial → lo + uno", () => {
      const s = suggestArticle("gnocco");
      expect(s?.definite).toBe("lo");
      expect(s?.indefinite).toBe("uno");
    });
    it("vowel initial masculine → l' + gli + un", () => {
      const s = suggestArticle("amico");
      expect(s?.definite).toBe("l'");
      expect(s?.definitePlural).toBe("gli");
      expect(s?.indefinite).toBe("un");
    });
    it("Greek -ma exception → masculine", () => {
      expect(suggestArticle("problema")?.definite).toBe("il");
      expect(suggestArticle("tema")?.definite).toBe("il");
      expect(suggestArticle("sistema")?.definite).toBe("il");
    });
    it("-tore → masculine", () => {
      expect(suggestArticle("scrittore")?.definite).toBe("lo"); // s+c
      expect(suggestArticle("attore")?.definite).toBe("l'"); // vowel
    });
  });

  describe("feminine", () => {
    it("-a ending → la + le + una", () => {
      const s = suggestArticle("casa");
      expect(s?.definite).toBe("la");
      expect(s?.definitePlural).toBe("le");
      expect(s?.indefinite).toBe("una");
      expect(s?.gender).toBe("f");
    });
    it("vowel initial feminine → l' + le + un'", () => {
      const s = suggestArticle("amica");
      expect(s?.definite).toBe("l'");
      expect(s?.definitePlural).toBe("le");
      expect(s?.indefinite).toBe("un'");
    });
    it("-zione → feminine", () => {
      expect(suggestArticle("stazione")?.definite).toBe("la");
      expect(suggestArticle("traduzione")?.definite).toBe("la");
    });
    it("-tà → feminine", () => {
      expect(suggestArticle("città")?.definite).toBe("la");
      expect(suggestArticle("libertà")?.definite).toBe("la");
    });
    it("-trice → feminine", () => {
      expect(suggestArticle("scrittrice")?.definite).toBe("la");
    });
    it("-o exceptions → feminine", () => {
      expect(suggestArticle("mano")?.definite).toBe("la");
      expect(suggestArticle("radio")?.definite).toBe("la");
    });
  });

  describe("confidence", () => {
    it("clear -o → high", () => {
      expect(suggestArticle("libro")?.confidence).toBe("high");
    });
    it("clear -a → high", () => {
      expect(suggestArticle("casa")?.confidence).toBe("high");
    });
    it("ambiguous -e → low", () => {
      expect(suggestArticle("cane")?.confidence).toBe("low");
      expect(suggestArticle("fiore")?.confidence).toBe("low");
    });
    it("unrecognized ending → low", () => {
      expect(suggestArticle("xyz")?.confidence).toBe("low");
    });
  });

  it("is case-insensitive", () => {
    expect(suggestArticle("LIBRO")?.definite).toBe("il");
    expect(suggestArticle("Casa")?.definite).toBe("la");
  });

  it("trims whitespace", () => {
    expect(suggestArticle("  libro  ")?.definite).toBe("il");
  });
});
