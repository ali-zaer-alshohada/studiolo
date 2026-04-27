import { describe, test, expect } from "vitest";
import { currentWarm } from "@/lib/ambient";

/**
 * Bucket boundaries match prototype lines 2616–2626 exactly:
 *   h < 6  → -0.6  (night cool)
 *   h < 9  →  0.2  (dawn warming)
 *   h < 18 →  0.3  (afternoon)
 *   h < 21 →  0.8  (dusk warm)
 *   else   → -0.4  (night cool)
 */
describe("currentWarm", () => {
  test("midnight (0h) is night cool: -0.6", () => {
    expect(currentWarm(0)).toBe(-0.6);
  });
  test("5h is still night cool: -0.6", () => {
    expect(currentWarm(5)).toBe(-0.6);
  });
  test("6h tips to dawn warming: 0.2", () => {
    expect(currentWarm(6)).toBe(0.2);
  });
  test("8h is dawn warming: 0.2", () => {
    expect(currentWarm(8)).toBe(0.2);
  });
  test("9h tips to afternoon: 0.3", () => {
    expect(currentWarm(9)).toBe(0.3);
  });
  test("17h is afternoon: 0.3", () => {
    expect(currentWarm(17)).toBe(0.3);
  });
  test("18h tips to dusk warm: 0.8", () => {
    expect(currentWarm(18)).toBe(0.8);
  });
  test("20h is dusk warm: 0.8", () => {
    expect(currentWarm(20)).toBe(0.8);
  });
  test("21h tips to night cool: -0.4", () => {
    expect(currentWarm(21)).toBe(-0.4);
  });
  test("23h is night cool: -0.4", () => {
    expect(currentWarm(23)).toBe(-0.4);
  });
});
