import { describe, it, expect } from "vitest";
import { inferAuxiliary, userUsedWrongAuxiliary } from "@/lib/italian/auxiliary";

describe("inferAuxiliary", () => {
  it("returns essere for movement verbs", () => {
    expect(inferAuxiliary("andare")).toBe("essere");
    expect(inferAuxiliary("venire")).toBe("essere");
    expect(inferAuxiliary("partire")).toBe("essere");
    expect(inferAuxiliary("uscire")).toBe("essere");
  });

  it("returns essere for state / change verbs", () => {
    expect(inferAuxiliary("essere")).toBe("essere");
    expect(inferAuxiliary("stare")).toBe("essere");
    expect(inferAuxiliary("diventare")).toBe("essere");
    expect(inferAuxiliary("rimanere")).toBe("essere");
  });

  it("returns essere for reflexives (-rsi)", () => {
    expect(inferAuxiliary("lavarsi")).toBe("essere");
    expect(inferAuxiliary("alzarsi")).toBe("essere");
    expect(inferAuxiliary("vestirsi")).toBe("essere");
  });

  it("returns avere for default verbs", () => {
    expect(inferAuxiliary("mangiare")).toBe("avere");
    expect(inferAuxiliary("parlare")).toBe("avere");
    expect(inferAuxiliary("scrivere")).toBe("avere");
    expect(inferAuxiliary("studiare")).toBe("avere");
  });

  it("is case-insensitive and trims", () => {
    expect(inferAuxiliary("ANDARE")).toBe("essere");
    expect(inferAuxiliary("  Mangiare  ")).toBe("avere");
  });
});

describe("userUsedWrongAuxiliary", () => {
  it("flags avere-form when essere was expected", () => {
    expect(userUsedWrongAuxiliary("ho andato", "essere")).toBe(true);
    expect(userUsedWrongAuxiliary("hanno partito", "essere")).toBe(true);
  });

  it("flags essere-form when avere was expected", () => {
    expect(userUsedWrongAuxiliary("sono mangiato", "avere")).toBe(true);
    expect(userUsedWrongAuxiliary("siamo parlato", "avere")).toBe(true);
  });

  it("does not flag correct auxiliary", () => {
    expect(userUsedWrongAuxiliary("sono andato", "essere")).toBe(false);
    expect(userUsedWrongAuxiliary("ho mangiato", "avere")).toBe(false);
  });

  it("does not flag empty input", () => {
    expect(userUsedWrongAuxiliary("", "essere")).toBe(false);
    expect(userUsedWrongAuxiliary("   ", "avere")).toBe(false);
  });

  it("does not flag non-auxiliary first words", () => {
    // user typed something that isn't an auxiliary at all (e.g. wrong tense)
    expect(userUsedWrongAuxiliary("vado", "essere")).toBe(false);
    expect(userUsedWrongAuxiliary("mangio", "avere")).toBe(false);
  });
});
