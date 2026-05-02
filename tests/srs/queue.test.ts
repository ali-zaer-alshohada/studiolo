import { describe, test, expect } from "vitest";
import { dueToday, shuffle, clampSession } from "@/lib/srs/queue";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(id: string, dueOffset: number): Card {
  return {
    id,
    en: id,
    it: id,
    cat: "altro",
    rung: 0,
    charge: 0,
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

describe("clampSession", () => {
  // Helpers — `mkCard` from above is due-relative; here we want explicit
  // control over reviewed + createdAt for the padding scenarios.
  function mkSeen(id: string, dueOffset: number, reviewed: number): Card {
    return { ...mkCard(id, dueOffset), reviewed };
  }
  function mkNew(id: string, createdAt: number): Card {
    return {
      ...mkCard(id, 365 * 86_400_000), // far-future due — not in `due` list
      reviewed: 0,
      createdAt,
    };
  }

  test("returns the queue unchanged when within [min, max]", () => {
    const due = [mkCard("a", 0), mkCard("b", 0), mkCard("c", 0)];
    expect(clampSession(due, due, 2, 5).map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  test("trims to `max` most-overdue when over the cap", () => {
    const due = [
      mkCard("a", -1000),
      mkCard("b", -3000),
      mkCard("c", -2000),
      mkCard("d", -500),
    ];
    expect(clampSession(due, due, 1, 2).map((c) => c.id)).toEqual(["b", "c"]);
  });

  test("pads with brand-new cards (reviewed=0) oldest createdAt first", () => {
    const due = [mkSeen("d1", 0, 3), mkSeen("d2", 0, 1)];
    const newer = mkNew("n1", 100);
    const older = mkNew("n2", 50); // older createdAt → comes first
    const pool = [...due, newer, older];
    const out = clampSession(due, pool, 4, 30);
    expect(out.map((c) => c.id)).toEqual(["d1", "d2", "n2", "n1"]);
  });

  test("does not double-include cards already in `due`", () => {
    const dup = mkSeen("dup", 0, 0); // reviewed=0 AND in due
    const fresh = mkNew("fresh", 0);
    const pool = [dup, fresh];
    const out = clampSession([dup], pool, 2, 30);
    expect(out.map((c) => c.id)).toEqual(["dup", "fresh"]);
  });

  test("skips paragraph cards when padding", () => {
    const due = [mkSeen("d1", 0, 1)];
    const para: Card = { ...mkNew("para", 10), paragraph: "long text" };
    const real = mkNew("real", 20);
    const pool = [...due, para, real];
    const out = clampSession(due, pool, 2, 30);
    expect(out.map((c) => c.id)).toEqual(["d1", "real"]);
  });

  test("ships under-min when no new cards are available", () => {
    const due = [mkSeen("d1", 0, 1), mkSeen("d2", 0, 2)];
    expect(clampSession(due, due, 5, 30).map((c) => c.id)).toEqual(["d1", "d2"]);
  });

  test("does not mutate the input arrays", () => {
    const due = [mkCard("a", 0), mkCard("b", 0)];
    const pool = [...due, mkNew("n", 0)];
    const dueSnap = [...due];
    const poolSnap = [...pool];
    clampSession(due, pool, 5, 10);
    expect(due).toEqual(dueSnap);
    expect(pool).toEqual(poolSnap);
  });
});
