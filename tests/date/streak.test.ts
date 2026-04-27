import { describe, test, expect } from "vitest";
import { bumpStreak } from "@/lib/date/streak";

/**
 * Streak rules (from prototype line 1875):
 *   - Same day as last bump → no-op (no double-counting)
 *   - Yesterday was the last bump → increment streakCount
 *   - Gap (≥2 days) or first ever → reset streakCount to 1
 *   - Either way, set streakLastDay to today's string
 *
 * Pure: takes (state, now) and returns the next state — never mutates.
 */
describe("bumpStreak", () => {
  test("first ever bump sets streakCount = 1 and stamps today", () => {
    const now = new Date(2026, 3, 27).getTime();
    const next = bumpStreak({ streakLastDay: null, streakCount: 0 }, now);
    expect(next.streakCount).toBe(1);
    expect(next.streakLastDay).toBe("2026-4-27");
  });

  test("same-day bump is a no-op", () => {
    const now = new Date(2026, 3, 27).getTime();
    const state = { streakLastDay: "2026-4-27", streakCount: 5 };
    const next = bumpStreak(state, now);
    expect(next).toEqual(state);
  });

  test("yesterday → today increments the streak", () => {
    const now = new Date(2026, 3, 27).getTime();
    const state = { streakLastDay: "2026-4-26", streakCount: 5 };
    const next = bumpStreak(state, now);
    expect(next.streakCount).toBe(6);
    expect(next.streakLastDay).toBe("2026-4-27");
  });

  test("two-day gap resets streak to 1", () => {
    const now = new Date(2026, 3, 27).getTime();
    const state = { streakLastDay: "2026-4-25", streakCount: 12 }; // 2 days ago
    const next = bumpStreak(state, now);
    expect(next.streakCount).toBe(1);
    expect(next.streakLastDay).toBe("2026-4-27");
  });

  test("does not mutate the input state", () => {
    const now = new Date(2026, 3, 27).getTime();
    const state = { streakLastDay: "2026-4-26", streakCount: 5 };
    const snapshot = { ...state };
    bumpStreak(state, now);
    expect(state).toEqual(snapshot);
  });

  test("bumping across a month boundary works (Apr 30 → May 1)", () => {
    const now = new Date(2026, 4, 1).getTime(); // May 1
    const state = { streakLastDay: "2026-4-30", streakCount: 3 };
    const next = bumpStreak(state, now);
    expect(next.streakCount).toBe(4);
    expect(next.streakLastDay).toBe("2026-5-1");
  });
});
