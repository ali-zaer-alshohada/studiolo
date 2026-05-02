import { describe, test, expect } from "vitest";
import {
  LADDER_HOURS,
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
  test("LADDER_HOURS matches the prototype: [3, 6, 24, 72, 144]", () => {
    expect(LADDER_HOURS).toEqual([3, 6, 24, 72, 144]);
  });

  test("CHILD_LADDER_HOURS matches the prototype: [1, 4, 24]", () => {
    expect(CHILD_LADDER_HOURS).toEqual([1, 4, 24]);
  });

  test("HOUR is 3,600,000 ms", () => {
    expect(HOUR).toBe(3_600_000);
  });
});

describe("srsCorrect", () => {
  test("bumps rung from 0 to 1 and schedules due at LADDER_HOURS[1] (6h)", () => {
    const card = mkCard({ rung: 0 });
    const result = srsCorrect(card, NOW);
    expect(result.rung).toBe(1);
    expect(result.due).toBe(NOW + 6 * HOUR);
  });

  test("increments reviewed counter, leaves wrongs alone", () => {
    const card = mkCard({ rung: 2, reviewed: 5, wrongs: 2 });
    const result = srsCorrect(card, NOW);
    expect(result.reviewed).toBe(6);
    expect(result.wrongs).toBe(2);
  });

  test("pushes a history entry with ok=true and the timestamp", () => {
    const card = mkCard({ history: [{ when: NOW - 10_000, ok: false, wrong: "x" }] });
    const result = srsCorrect(card, NOW);
    expect(result.history).toHaveLength(2);
    expect(result.history[1]).toEqual({ when: NOW, ok: true });
  });

  test("caps rung at LADDER_HOURS.length - 1 (= 4) when already at top", () => {
    const card = mkCard({ rung: 4 });
    const result = srsCorrect(card, NOW);
    expect(result.rung).toBe(4); // not 5
    expect(result.due).toBe(NOW + 144 * HOUR); // ladder[4]
  });

  test("uses CHILD_LADDER_HOURS for chained children (rung 0 → 1 = 4h)", () => {
    const card = mkCard({ isChild: true, parentId: "p1", rung: 0 });
    const result = srsCorrect(card, NOW);
    expect(result.rung).toBe(1);
    expect(result.due).toBe(NOW + 4 * HOUR);
  });

  test("caps child rung at CHILD_LADDER_HOURS.length - 1 (= 2)", () => {
    const card = mkCard({ isChild: true, parentId: "p1", rung: 2 });
    const result = srsCorrect(card, NOW);
    expect(result.rung).toBe(2);
    expect(result.due).toBe(NOW + 24 * HOUR); // ladder[2]
  });

  test("does NOT mutate the input card (purity)", () => {
    const card = mkCard({ rung: 0, reviewed: 0 });
    const snapshot = structuredClone(card);
    srsCorrect(card, NOW);
    expect(card).toEqual(snapshot);
  });
});

describe("srsWrong", () => {
  test("resets rung to 0 regardless of current rung", () => {
    const card = mkCard({ rung: 3 });
    const result = srsWrong(card, "ho andato", NOW);
    expect(result.rung).toBe(0);
  });

  test("schedules due at LADDER_HOURS[0] (3h) for normal cards", () => {
    const card = mkCard({ rung: 4 });
    const result = srsWrong(card, "x", NOW);
    expect(result.due).toBe(NOW + 3 * HOUR);
  });

  test("schedules due at CHILD_LADDER_HOURS[0] (1h) for chained children", () => {
    const card = mkCard({ isChild: true, parentId: "p1", rung: 2 });
    const result = srsWrong(card, "x", NOW);
    expect(result.due).toBe(NOW + 1 * HOUR);
  });

  test("increments wrongs and reviewed; pushes ok=false history entry with the wrong text", () => {
    const card = mkCard({ wrongs: 1, reviewed: 4 });
    const result = srsWrong(card, "ho andato", NOW);
    expect(result.wrongs).toBe(2);
    expect(result.reviewed).toBe(5);
    expect(result.history).toHaveLength(1);
    expect(result.history[0]).toEqual({ when: NOW, ok: false, wrong: "ho andato" });
  });

  test("does NOT mutate the input card (purity)", () => {
    const card = mkCard({ rung: 2, wrongs: 1 });
    const snapshot = structuredClone(card);
    srsWrong(card, "x", NOW);
    expect(card).toEqual(snapshot);
  });
});
