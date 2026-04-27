import { describe, test, expect } from "vitest";
import { dueToday, shuffle } from "@/lib/srs/queue";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(id: string, dueOffset: number): Card {
  return {
    id,
    en: id,
    it: id,
    cat: "altro",
    rung: 0,
    due: NOW + dueOffset,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW - 86_400_000,
  };
}

describe("dueToday", () => {
  test("returns cards whose due <= now", () => {
    const a = mkCard("a", -1000);
    const b = mkCard("b", 0);
    const c = mkCard("c", 60_000);
    expect(dueToday([a, b, c], NOW).map((x) => x.id)).toEqual(["a", "b"]);
  });

  test("returns empty array when no cards are due", () => {
    const future = mkCard("x", 1_000_000);
    expect(dueToday([future], NOW)).toEqual([]);
  });

  test("returns empty array when input is empty", () => {
    expect(dueToday([], NOW)).toEqual([]);
  });

  test("does not mutate the input array", () => {
    const a = mkCard("a", 0);
    const b = mkCard("b", 1_000);
    const arr = [a, b];
    const snapshot = [...arr];
    dueToday(arr, NOW);
    expect(arr).toEqual(snapshot);
  });
});

describe("shuffle", () => {
  // A predictable RNG so tests are deterministic.
  function seededRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  test("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr, seededRng(1)).length).toBe(arr.length);
  });

  test("contains the same elements (set equality)", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, seededRng(1));
    expect([...out].sort()).toEqual([...arr].sort());
  });

  test("is deterministic given the same rng seed", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr, seededRng(42))).toEqual(shuffle(arr, seededRng(42)));
  });

  test("produces a different order with a different seed (probabilistic but stable here)", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(arr, seededRng(1))).not.toEqual(shuffle(arr, seededRng(99)));
  });

  test("does not mutate the input array", () => {
    const arr = [1, 2, 3, 4, 5];
    const snapshot = [...arr];
    shuffle(arr, seededRng(1));
    expect(arr).toEqual(snapshot);
  });

  test("empty array shuffles to empty array", () => {
    expect(shuffle([], seededRng(1))).toEqual([]);
  });

  test("single-element array shuffles to itself", () => {
    expect(shuffle([42], seededRng(1))).toEqual([42]);
  });
});
