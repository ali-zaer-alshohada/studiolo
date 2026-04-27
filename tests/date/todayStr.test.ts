import { describe, test, expect } from "vitest";
import { todayStr } from "@/lib/date/todayStr";

/**
 * Local-time YYYY-M-D format — NOT zero-padded, matching prototype line 1873.
 * (Zero-padding is more conventional but the prototype's behaviour is what
 * existing user data is keyed by; we preserve it.)
 */
describe("todayStr", () => {
  test("formats a date as YYYY-M-D in local time, no zero-padding", () => {
    const d = new Date(2026, 3, 27); // April 27, 2026 (month is 0-indexed)
    expect(todayStr(d)).toBe("2026-4-27");
  });

  test("handles single-digit month and day with no padding", () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(todayStr(d)).toBe("2026-1-5");
  });

  test("handles December correctly (month index 11 → '12')", () => {
    const d = new Date(2026, 11, 31);
    expect(todayStr(d)).toBe("2026-12-31");
  });

  test("two same-day dates produce the same string", () => {
    const morning = new Date(2026, 3, 27, 8, 30);
    const evening = new Date(2026, 3, 27, 22, 15);
    expect(todayStr(morning)).toBe(todayStr(evening));
  });
});
