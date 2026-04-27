import { describe, test, expect } from "vitest";
import {
  initTypingState,
  applyKey,
  applyBackspace,
  computeWPM,
  computeAccuracy,
  isFinished,
} from "@/lib/srs/typing";

describe("initTypingState", () => {
  test("creates a fresh state with index 0 and all letters untouched", () => {
    const s = initTypingState("ciao");
    expect(s.index).toBe(0);
    expect(s.text).toBe("ciao");
    expect(s.states).toEqual(["untouched", "untouched", "untouched", "untouched"]);
    expect(s.startedAt).toBeNull();
    expect(s.correctCount).toBe(0);
    expect(s.wrongCount).toBe(0);
  });
});

describe("applyKey", () => {
  test("correct key marks letter `right` and advances", () => {
    const s = applyKey(initTypingState("ciao"), "c", 1000);
    expect(s.states[0]).toBe("right");
    expect(s.index).toBe(1);
    expect(s.correctCount).toBe(1);
    expect(s.wrongCount).toBe(0);
    expect(s.startedAt).toBe(1000); // first keystroke stamps the start
  });

  test("wrong key marks letter `wrong` and advances (default behavior)", () => {
    const s = applyKey(initTypingState("ciao"), "x", 1000);
    expect(s.states[0]).toBe("wrong");
    expect(s.index).toBe(1);
    expect(s.correctCount).toBe(0);
    expect(s.wrongCount).toBe(1);
  });

  test("ignores keys past the end (returns same state ref)", () => {
    let s = initTypingState("ab");
    s = applyKey(s, "a", 1000);
    s = applyKey(s, "b", 1100);
    const finished = applyKey(s, "x", 1200);
    expect(finished).toBe(s);
  });

  test("space character is comparable to ' '", () => {
    const s = applyKey(initTypingState("a b"), "a", 1);
    const s2 = applyKey(s, " ", 2);
    expect(s2.states[1]).toBe("right");
  });

  test("does not stamp startedAt twice", () => {
    let s = initTypingState("ciao");
    s = applyKey(s, "c", 1000);
    s = applyKey(s, "i", 5000);
    expect(s.startedAt).toBe(1000);
  });
});

describe("applyBackspace", () => {
  test("rewinds index by 1 and restores letter to untouched", () => {
    let s = applyKey(initTypingState("ciao"), "c", 1000);
    expect(s.index).toBe(1);
    s = applyBackspace(s);
    expect(s.index).toBe(0);
    expect(s.states[0]).toBe("untouched");
  });

  test("decrements correctCount when rewinding a right letter", () => {
    let s = applyKey(initTypingState("ciao"), "c", 1000);
    s = applyBackspace(s);
    expect(s.correctCount).toBe(0);
  });

  test("decrements wrongCount when rewinding a wrong letter", () => {
    let s = applyKey(initTypingState("ciao"), "x", 1000);
    s = applyBackspace(s);
    expect(s.wrongCount).toBe(0);
  });

  test("no-op at index 0", () => {
    const s = initTypingState("ciao");
    const after = applyBackspace(s);
    expect(after).toBe(s);
  });
});

describe("computeWPM", () => {
  test("returns 0 when nothing typed yet", () => {
    expect(computeWPM(initTypingState("ciao"), 5000)).toBe(0);
  });

  test("words = correctCount / 5; WPM = words / minutes", () => {
    let s = initTypingState("ciao mondo");
    // Type 10 correct chars in 60 seconds = 2 words / 1 minute = 2 wpm
    s = { ...s, correctCount: 10, startedAt: 0 };
    expect(computeWPM(s, 60_000)).toBe(2);
  });
});

describe("computeAccuracy", () => {
  test("returns 100 when no attempts", () => {
    expect(computeAccuracy(initTypingState("ciao"))).toBe(100);
  });

  test("correct / (correct + wrong) * 100, rounded", () => {
    const s = { ...initTypingState("ciao"), correctCount: 7, wrongCount: 3 };
    expect(computeAccuracy(s)).toBe(70);
  });
});

describe("isFinished", () => {
  test("false until index === text.length", () => {
    const s = initTypingState("ab");
    expect(isFinished(s)).toBe(false);
    const s1 = applyKey(s, "a", 1);
    expect(isFinished(s1)).toBe(false);
    const s2 = applyKey(s1, "b", 2);
    expect(isFinished(s2)).toBe(true);
  });
});
