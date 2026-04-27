import { describe, test, expect } from "vitest";
import { shouldSpawnChild, makeChild } from "@/lib/srs/child";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "p1",
    en: "I went",
    it: "sono andato",
    cat: "verbo",
    rung: 0,
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

describe("shouldSpawnChild", () => {
  test("returns false when card has < 2 wrongs", () => {
    const card = mkCard({ wrongs: 1 });
    expect(shouldSpawnChild(card, [card], "ausiliare")).toBe(false);
  });

  test("returns true when wrongs >= 2 and no existing child for that ctx", () => {
    const card = mkCard({ wrongs: 2 });
    expect(shouldSpawnChild(card, [card], "ausiliare")).toBe(true);
  });

  test("returns false when card is itself a child (no grandchildren)", () => {
    const child = mkCard({
      id: "c1",
      isChild: true,
      parentId: "p1",
      wrongs: 5,
    });
    expect(shouldSpawnChild(child, [child], "preposizione")).toBe(false);
  });

  test("returns false when a child for this ctx already exists", () => {
    const parent = mkCard({ id: "p1", wrongs: 3 });
    const existingChild = mkCard({
      id: "c1",
      isChild: true,
      parentId: "p1",
      ctx: "ausiliare",
    });
    expect(
      shouldSpawnChild(parent, [parent, existingChild], "ausiliare"),
    ).toBe(false);
  });

  test("returns true when an existing child has a different ctx", () => {
    const parent = mkCard({ id: "p1", wrongs: 3 });
    const existingChild = mkCard({
      id: "c1",
      isChild: true,
      parentId: "p1",
      ctx: "preposizione",
    });
    expect(
      shouldSpawnChild(parent, [parent, existingChild], "ausiliare"),
    ).toBe(true);
  });
});

describe("makeChild", () => {
  test("inherits en / it / cat from parent", () => {
    const parent = mkCard({ en: "I went", it: "sono andato", cat: "verbo" });
    const child = makeChild(parent, "ausiliare", NOW);
    expect(child.en).toBe("I went");
    expect(child.it).toBe("sono andato");
    expect(child.cat).toBe("verbo");
  });

  test("has parentId set to parent.id and isChild = true", () => {
    const parent = mkCard({ id: "p-xyz" });
    const child = makeChild(parent, "ausiliare", NOW);
    expect(child.parentId).toBe("p-xyz");
    expect(child.isChild).toBe(true);
  });

  test("starts at rung 0, due now, no wrongs/reviewed/history", () => {
    const parent = mkCard();
    const child = makeChild(parent, "ausiliare", NOW);
    expect(child.rung).toBe(0);
    expect(child.due).toBe(NOW);
    expect(child.wrongs).toBe(0);
    expect(child.reviewed).toBe(0);
    expect(child.history).toEqual([]);
  });

  test("tags the child with the given ctx", () => {
    const parent = mkCard();
    const child = makeChild(parent, "ausiliare", NOW);
    expect(child.ctx).toBe("ausiliare");
  });

  test("has a unique id distinct from parent", () => {
    const parent = mkCard({ id: "p1" });
    const child = makeChild(parent, "ausiliare", NOW);
    expect(child.id).not.toBe("p1");
    expect(child.id.length).toBeGreaterThan(0);
  });
});
