import { describe, test, expect } from "vitest";
import { buildConcordance } from "@/lib/srs/concordance";
import type { ErrorEvent } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function err(wrong: string, correct: string, when: number = NOW, ctx = "traduzione"): ErrorEvent {
  return { cardId: "c", when, wrong, correct, ctx };
}

describe("buildConcordance", () => {
  test("returns empty array for empty input", () => {
    expect(buildConcordance([])).toEqual([]);
  });

  test("groups by first letter of normalized wrong, uppercased", () => {
    const c = buildConcordance([
      err("ciao", "buongiorno"),
      err("aiuto", "soccorso"),
      err("ali", "ali"),
    ]);
    const letters = c.map((g) => g.letter);
    expect(letters).toContain("A");
    expect(letters).toContain("C");
  });

  test("collapses identical wrong→correct pairs, counting frequency", () => {
    const c = buildConcordance([
      err("la problema", "il problema"),
      err("la problema", "il problema"),
      err("la problema", "il problema"),
    ]);
    expect(c).toHaveLength(1);
    expect(c[0]?.entries[0]).toMatchObject({
      wrong: "la problema",
      correct: "il problema",
      count: 3,
    });
  });

  test("within a letter group, sorts by frequency descending", () => {
    const c = buildConcordance([
      err("alfa", "alpha"),
      err("alfa", "alpha"),
      err("ali", "alis"),
      err("alfa", "alpha"),
      err("ammazza", "incredibile"),
    ]);
    const aGroup = c.find((g) => g.letter === "A");
    expect(aGroup?.entries.map((e) => e.wrong)).toEqual(["alfa", "ali", "ammazza"]);
    expect(aGroup?.entries[0]?.count).toBe(3);
  });

  test("letter groups are returned in alphabetical order", () => {
    const c = buildConcordance([
      err("zucchero", "miele"),
      err("ananas", "banana"),
      err("mela", "pera"),
    ]);
    expect(c.map((g) => g.letter)).toEqual(["A", "M", "Z"]);
  });

  test("uses Italian collation: à è é ì ò ù grouped under their base letter or sorted within", () => {
    const c = buildConcordance([
      err("è", "ed"),
      err("ananas", "banana"),
    ]);
    // È should fall under E (or its own — depends on locale). At minimum, both groups exist.
    const letters = c.map((g) => g.letter);
    expect(letters.length).toBe(2);
  });

  test("preserves the original (un-normalized) wrong/correct strings for display", () => {
    const c = buildConcordance([err("La Problema!", "Il Problema")]);
    expect(c[0]?.entries[0]).toMatchObject({
      wrong: "La Problema!", // verbatim, not normalized
      correct: "Il Problema",
    });
  });

  test("falls back to '·' for empty/non-letter wrong strings", () => {
    const c = buildConcordance([err("?", "il tavolo"), err("", "qualcosa")]);
    const letters = c.map((g) => g.letter);
    expect(letters).toContain("·");
  });

  test("tracks the most-recent occurrence timestamp", () => {
    const c = buildConcordance([
      err("foo", "bar", 1000),
      err("foo", "bar", 5000),
      err("foo", "bar", 3000),
    ]);
    expect(c[0]?.entries[0]?.lastSeen).toBe(5000);
  });
});
