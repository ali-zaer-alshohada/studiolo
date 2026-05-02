import { describe, test, expect } from "vitest";
import {
  LADDER_HOURS,
  STACKS,
  CHILD_LADDER_HOURS,
  HOUR,
  srsCorrect,
  srsWrong,
} from "@/lib/srs/ladder";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000; // fixed epoch for deterministic tests

function mkCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    en: "the table",
    it: "il tavolo",
    cat: "sostantivo",
    rung: 0,
    charge: 0,
    due: NOW,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW - 86_400_000,
    ...overrides,
  };
}

describe("ladder constants", () => {
  test("LADDER_HOURS encodes the new model: [3, 24, 72, 168, 504]", () => {
    expect(LADDER_HOURS).toEqual([3, 24, 72, 168, 504]);
  });

  test("STACKS encodes the per-rung budget: [1, 2, 3, 2, 1]", () => {
    expect(STACKS).toEqual([1, 2, 3, 2, 1]);
  });

  test("CHILD_LADDER_HOURS unchanged: [1, 4, 24]", () => {
    expect(CHILD_LADDER_HOURS).toEqual([1, 4, 24]);
  });

  test("HOUR is 3,600,000 ms", () => {
    expect(HOUR).toBe(3_600_000);
  });
});

describe("srsCorrect — main cards", () => {
  test("rung i (single shot): right → promote to ii, charge=0, due += 24h", () => {
    const card = mkCard({ rung: 0, charge: 0 });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(1);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 24 * HOUR);
  });

  test("rung ii charge 0 → charge 1, stay, re-cycle in 24h", () => {
    const card = mkCard({ rung: 1, charge: 0 });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(1);
    expect(r.charge).toBe(1);
    expect(r.due).toBe(NOW + 24 * HOUR);
  });

  test("rung ii charge 1 → promote to iii (threshold 2), charge=0, due += 72h", () => {
    const card = mkCard({ rung: 1, charge: 1 });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(2);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 72 * HOUR);
  });

  test("rung iii needs 3 corrects to promote (threshold 3)", () => {
    let c = mkCard({ rung: 2, charge: 0 });
    c = srsCorrect(c, NOW);
    expect(c.rung).toBe(2);
    expect(c.charge).toBe(1);
    c = srsCorrect(c, NOW);
    expect(c.rung).toBe(2);
    expect(c.charge).toBe(2);
    c = srsCorrect(c, NOW);
    expect(c.rung).toBe(3);
    expect(c.charge).toBe(0);
    expect(c.due).toBe(NOW + 168 * HOUR);
  });

  test("rung iv charge 1 → promote to v (threshold 2), charge=0, due += 504h", () => {
    const card = mkCard({ rung: 3, charge: 1 });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(4);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 504 * HOUR);
  });

  test("rung v (uncollected): right grants the certificate, stays at v, due += 504h", () => {
    const card = mkCard({ rung: 4, charge: 0, collected: undefined });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(4);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 504 * HOUR);
    expect(r.collected).toEqual({ when: NOW });
  });

  test("rung v (already collected): right preserves collection timestamp, just re-cycles", () => {
    const card = mkCard({
      rung: 4,
      charge: 0,
      collected: { when: NOW - 30 * 86_400_000 },
    });
    const r = srsCorrect(card, NOW + 21 * 86_400_000);
    expect(r.rung).toBe(4);
    expect(r.collected?.when).toBe(NOW - 30 * 86_400_000); // unchanged
  });

  test("counters: increments reviewed, leaves wrongs alone, appends ok=true history", () => {
    const card = mkCard({ rung: 1, charge: 0, reviewed: 5, wrongs: 2 });
    const r = srsCorrect(card, NOW);
    expect(r.reviewed).toBe(6);
    expect(r.wrongs).toBe(2);
    expect(r.history.at(-1)).toEqual({ when: NOW, ok: true });
  });

  test("does NOT mutate the input card (purity)", () => {
    const card = mkCard({ rung: 2, charge: 1 });
    const snapshot = structuredClone(card);
    srsCorrect(card, NOW);
    expect(card).toEqual(snapshot);
  });
});

describe("srsWrong — main cards", () => {
  test("rung i (floor): wrong stays at i, charge=0, due += 3h", () => {
    const card = mkCard({ rung: 0, charge: 0 });
    const r = srsWrong(card, "x", NOW);
    expect(r.rung).toBe(0);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 3 * HOUR);
  });

  test("rung ii charge 0 → charge -1, stay, re-cycle in 24h", () => {
    const card = mkCard({ rung: 1, charge: 0 });
    const r = srsWrong(card, "x", NOW);
    expect(r.rung).toBe(1);
    expect(r.charge).toBe(-1);
    expect(r.due).toBe(NOW + 24 * HOUR);
  });

  test("rung ii charge -1 → demote to i (threshold -2), charge=0, due += 3h", () => {
    const card = mkCard({ rung: 1, charge: -1 });
    const r = srsWrong(card, "x", NOW);
    expect(r.rung).toBe(0);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 3 * HOUR);
  });

  test("rung iii needs 3 wrongs to demote (threshold -3)", () => {
    let c = mkCard({ rung: 2, charge: 0 });
    c = srsWrong(c, "x", NOW);
    expect(c.charge).toBe(-1);
    c = srsWrong(c, "x", NOW);
    expect(c.charge).toBe(-2);
    c = srsWrong(c, "x", NOW);
    expect(c.rung).toBe(1);
    expect(c.charge).toBe(0);
    expect(c.due).toBe(NOW + 24 * HOUR);
  });

  test("rung iv charge -1 → demote to iii (threshold -2), charge=0", () => {
    const card = mkCard({ rung: 3, charge: -1 });
    const r = srsWrong(card, "x", NOW);
    expect(r.rung).toBe(2);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 72 * HOUR);
  });

  test("rung v (single-shot): any wrong demotes to iv, charge=0", () => {
    const card = mkCard({ rung: 4, charge: 0 });
    const r = srsWrong(card, "x", NOW);
    expect(r.rung).toBe(3);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 168 * HOUR);
  });

  test("rung v wrong preserves an existing collected timestamp", () => {
    const card = mkCard({
      rung: 4,
      charge: 0,
      collected: { when: NOW - 86_400_000 },
    });
    const r = srsWrong(card, "x", NOW);
    expect(r.collected?.when).toBe(NOW - 86_400_000);
  });

  test("counters: increments wrongs+reviewed, appends ok=false history with wrong text", () => {
    const card = mkCard({ rung: 1, charge: 0, wrongs: 1, reviewed: 4 });
    const r = srsWrong(card, "ho andato", NOW);
    expect(r.wrongs).toBe(2);
    expect(r.reviewed).toBe(5);
    expect(r.history.at(-1)).toEqual({ when: NOW, ok: false, wrong: "ho andato" });
  });

  test("does NOT mutate the input card (purity)", () => {
    const card = mkCard({ rung: 2, charge: -2, wrongs: 1 });
    const snapshot = structuredClone(card);
    srsWrong(card, "x", NOW);
    expect(card).toEqual(snapshot);
  });
});

describe("the journey — non-monotonic right/wrong oscillation", () => {
  test("right-wrong-right-wrong at ii leaves charge oscillating between 0 and 1", () => {
    let c = mkCard({ rung: 1, charge: 0 });
    c = srsCorrect(c, NOW); // 1
    expect(c.charge).toBe(1);
    c = srsWrong(c, "x", NOW); // 0
    expect(c.charge).toBe(0);
    expect(c.rung).toBe(1); // never escaped
    c = srsCorrect(c, NOW); // 1
    expect(c.charge).toBe(1);
    c = srsWrong(c, "x", NOW); // 0
    expect(c.charge).toBe(0);
    expect(c.rung).toBe(1);
  });
});

describe("srsCorrect/srsWrong — chained children (simple model preserved)", () => {
  test("right at child rung 0 → 1 = 4h", () => {
    const card = mkCard({ isChild: true, parentId: "p1", rung: 0 });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(1);
    expect(r.due).toBe(NOW + 4 * HOUR);
  });

  test("right caps at child rung 2 (CHILD_LADDER_HOURS.length - 1)", () => {
    const card = mkCard({ isChild: true, parentId: "p1", rung: 2 });
    const r = srsCorrect(card, NOW);
    expect(r.rung).toBe(2);
    expect(r.due).toBe(NOW + 24 * HOUR);
  });

  test("wrong at any child rung resets to rung 0 = 1h, charge=0", () => {
    const card = mkCard({ isChild: true, parentId: "p1", rung: 2 });
    const r = srsWrong(card, "x", NOW);
    expect(r.rung).toBe(0);
    expect(r.charge).toBe(0);
    expect(r.due).toBe(NOW + 1 * HOUR);
  });
});
