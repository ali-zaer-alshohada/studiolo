import { describe, test, expect } from "vitest";
import { normalize } from "@/lib/text/normalize";

describe("normalize", () => {
  test("returns empty string for null/undefined/empty input", () => {
    expect(normalize("")).toBe("");
    expect(normalize(null)).toBe("");
    expect(normalize(undefined)).toBe("");
  });

  test("lowercases input", () => {
    expect(normalize("Il TaVoLo")).toBe("il tavolo");
  });

  test("trims surrounding whitespace", () => {
    expect(normalize("  ciao  ")).toBe("ciao");
  });

  test("strips trailing punctuation .,;:!?", () => {
    expect(normalize("ciao.")).toBe("ciao");
    expect(normalize("ciao!")).toBe("ciao");
    expect(normalize("ciao,")).toBe("ciao");
    expect(normalize("ciao;")).toBe("ciao");
    expect(normalize("ciao:")).toBe("ciao");
    expect(normalize("ciao?")).toBe("ciao");
  });

  test("collapses runs of whitespace into single spaces", () => {
    expect(normalize("buon  giorno")).toBe("buon giorno");
    expect(normalize("buon\t\tgiorno")).toBe("buon giorno");
    expect(normalize("buon\n\ngiorno")).toBe("buon giorno");
  });

  test("preserves Italian accented characters (à è é ì ò ù)", () => {
    expect(normalize("Città")).toBe("città");
    expect(normalize("Caffè")).toBe("caffè");
    expect(normalize("Però")).toBe("però");
  });

  test("treats two strings as equal after normalization", () => {
    expect(normalize(" Il Tavolo. ")).toBe(normalize("il tavolo"));
  });
});
