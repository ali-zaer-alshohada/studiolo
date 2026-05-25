import { describe, test, expect } from "vitest";
import {
  reviewedCard,
  reviewIntervalHours,
  formatIntervalIt,
} from "@/lib/srs/review";
import { LADDER_HOURS, CHILD_LADDER_HOURS, HOUR } from "@/lib/srs/ladder";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

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

describe("reviewIntervalHours — step model (rosso ↓1 · giallo hold · blu ↑1)", () => {
  test("rung 0: rosso & giallo hold at the floor, blu steps up", () => {
    const c = mkCard({ rung: 0 });
    expect(reviewIntervalHours(c, "rosso")).toBe(LADDER_HOURS[0]); // can't descend below floor
    expect(reviewIntervalHours(c, "giallo")).toBe(LADDER_HOURS[0]); // hold at 0
    expect(reviewIntervalHours(c, "blu")).toBe(LADDER_HOURS[1]); // up to 1 (24h)
  });

  test("rung 2: rosso steps down, giallo holds, blu steps up", () => {
    const c = mkCard({ rung: 2 });
    expect(reviewIntervalHours(c, "rosso")).toBe(LADDER_HOURS[1]); // down to 1 (24h)
    expect(reviewIntervalHours(c, "giallo")).toBe(LADDER_HOURS[2]); // hold 2 (72h)
    expect(reviewIntervalHours(c, "blu")).toBe(LADDER_HOURS[3]); // up to 3 (168h)
  });

  test("top card (rung 4): blu caps at the top, rosso steps down", () => {
    const c = mkCard({ rung: 4 });
    expect(reviewIntervalHours(c, "rosso")).toBe(LADDER_HOURS[3]); // down to 3 (168h)
    expect(reviewIntervalHours(c, "giallo")).toBe(LADDER_HOURS[4]); // hold 4 (504h)
    expect(reviewIntervalHours(c, "blu")).toBe(LADDER_HOURS[4]); // capped at 4
  });

  test("chained child uses the tighter child ladder", () => {
    const c = mkCard({ isChild: true, rung: 1 });
    expect(reviewIntervalHours(c, "rosso")).toBe(CHILD_LADDER_HOURS[0]); // down to 0 (1h)
    expect(reviewIntervalHours(c, "giallo")).toBe(CHILD_LADDER_HOURS[1]); // hold 1 (4h)
    expect(reviewIntervalHours(c, "blu")).toBe(CHILD_LADDER_HOURS[2]); // up to 2 (24h)
  });
});

describe("reviewedCard — rung + due + bookkeeping", () => {
  test("rosso steps down one rung and counts a wrong", () => {
    const c = mkCard({ rung: 3, wrongs: 1, reviewed: 5 });
    const after = reviewedCard(c, "rosso", NOW);
    expect(after.rung).toBe(2);
    expect(after.due).toBe(NOW + (LADDER_HOURS[2] ?? 0) * HOUR);
    expect(after.wrongs).toBe(2);
    expect(after.reviewed).toBe(6);
    expect(after.history.at(-1)).toEqual({ when: NOW, ok: false });
  });

  test("rosso at the floor stays at rung 0", () => {
    const after = reviewedCard(mkCard({ rung: 0 }), "rosso", NOW);
    expect(after.rung).toBe(0);
  });

  test("giallo holds the rung, no wrong logged", () => {
    const c = mkCard({ rung: 2, wrongs: 1, reviewed: 5 });
    const after = reviewedCard(c, "giallo", NOW);
    expect(after.rung).toBe(2);
    expect(after.due).toBe(NOW + (LADDER_HOURS[2] ?? 0) * HOUR);
    expect(after.wrongs).toBe(1);
    expect(after.reviewed).toBe(6);
    expect(after.history.at(-1)).toEqual({ when: NOW, ok: true });
  });

  test("blu promotes one rung", () => {
    const c = mkCard({ rung: 1 });
    const after = reviewedCard(c, "blu", NOW);
    expect(after.rung).toBe(2);
    expect(after.due).toBe(NOW + (LADDER_HOURS[2] ?? 0) * HOUR);
  });

  test("charge is always zeroed (stacks belong to the old exam)", () => {
    const c = mkCard({ rung: 2, charge: 2 });
    expect(reviewedCard(c, "giallo", NOW).charge).toBe(0);
  });
});

describe("formatIntervalIt", () => {
  test("hours, days, weeks — singular and plural", () => {
    expect(formatIntervalIt(1)).toBe("fra 1 ora");
    expect(formatIntervalIt(3)).toBe("fra 3 ore");
    expect(formatIntervalIt(24)).toBe("fra 1 giorno");
    expect(formatIntervalIt(72)).toBe("fra 3 giorni");
    expect(formatIntervalIt(168)).toBe("fra 1 settimana");
    expect(formatIntervalIt(504)).toBe("fra 3 settimane");
  });
});
