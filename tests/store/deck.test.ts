import { describe, test, expect, beforeEach } from "vitest";
import { useDeckStore } from "@/lib/store/deck";
import type { DeckPayload } from "@/lib/io/types";

beforeEach(() => {
  useDeckStore.getState().resetAll();
});

describe("deck store · gradeCorrect", () => {
  test("bumps the card's rung and reviewed counter", () => {
    const id = useDeckStore.getState().addCard({
      en: "the table", it: "il tavolo", cat: "sostantivo",
    });
    useDeckStore.getState().gradeCorrect(id);

    const card = useDeckStore.getState().cards.find((c) => c.id === id);
    expect(card?.rung).toBe(1);
    expect(card?.reviewed).toBe(1);
    expect(card?.history.at(-1)?.ok).toBe(true);
  });

  test("does nothing if cardId is unknown (no throw, no side effect)", () => {
    expect(() => useDeckStore.getState().gradeCorrect("nope")).not.toThrow();
    expect(useDeckStore.getState().cards).toEqual([]);
  });
});

describe("deck store · gradeWrong", () => {
  test("appends an ErrorEvent to errors[] with cardId, wrong, correct, ctx", () => {
    const id = useDeckStore.getState().addCard({
      en: "I went", it: "sono andato", cat: "verbo",
    });
    useDeckStore.getState().gradeWrong(id, "ho andato", "sono andato", "ausiliare");

    const errors = useDeckStore.getState().errors;
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      cardId: id,
      wrong: "ho andato",
      correct: "sono andato",
      ctx: "ausiliare",
    });
  });

  test("resets the card's rung to 0 and increments wrongs", () => {
    const id = useDeckStore.getState().addCard({
      en: "I went", it: "sono andato", cat: "verbo",
    });
    // Get to rung 2 first
    useDeckStore.getState().gradeCorrect(id);
    useDeckStore.getState().gradeCorrect(id);
    // Then a wrong should kick it back to 0
    useDeckStore.getState().gradeWrong(id, "ho andato", "sono andato", "ausiliare");

    const card = useDeckStore.getState().cards.find((c) => c.id === id);
    expect(card?.rung).toBe(0);
    expect(card?.wrongs).toBe(1);
  });

  test("spawns a chained child on the SECOND wrong with the same ctx", () => {
    const id = useDeckStore.getState().addCard({
      en: "I went", it: "sono andato", cat: "verbo",
    });
    useDeckStore.getState().gradeWrong(id, "ho andato", "sono andato", "ausiliare");
    expect(useDeckStore.getState().cards.filter((c) => c.isChild)).toHaveLength(0);

    useDeckStore.getState().gradeWrong(id, "ho andato", "sono andato", "ausiliare");
    const children = useDeckStore.getState().cards.filter((c) => c.isChild);
    expect(children).toHaveLength(1);
    expect(children[0]?.parentId).toBe(id);
    expect(children[0]?.ctx).toBe("ausiliare");
    expect(children[0]?.en).toBe("I went");
    expect(children[0]?.it).toBe("sono andato");
  });

  test("does NOT spawn a duplicate child for the same ctx", () => {
    const id = useDeckStore.getState().addCard({
      en: "I went", it: "sono andato", cat: "verbo",
    });
    // 3 wrongs with same ctx → 1 child only
    for (let i = 0; i < 3; i++) {
      useDeckStore.getState().gradeWrong(id, "ho andato", "sono andato", "ausiliare");
    }
    const children = useDeckStore.getState().cards.filter((c) => c.isChild);
    expect(children).toHaveLength(1);
  });

  test("DOES spawn a separate child for a different ctx (parallel chains)", () => {
    const id = useDeckStore.getState().addCard({
      en: "I think about you", it: "penso a te", cat: "verbo",
    });
    useDeckStore.getState().gradeWrong(id, "penso di te", "penso a te", "preposizione");
    useDeckStore.getState().gradeWrong(id, "penso di te", "penso a te", "preposizione");
    useDeckStore.getState().gradeWrong(id, "io penso a te", "penso a te", "pronome-soggetto");

    const children = useDeckStore.getState().cards.filter((c) => c.isChild);
    const ctxs = children.map((c) => c.ctx).sort();
    expect(ctxs).toEqual(["preposizione", "pronome-soggetto"]);
  });
});

describe("deck store · streak", () => {
  test("first gradeCorrect of the day sets streakCount to 1", () => {
    const id = useDeckStore.getState().addCard({
      en: "x", it: "x", cat: "altro",
    });
    expect(useDeckStore.getState().streakCount).toBe(0);
    useDeckStore.getState().gradeCorrect(id);
    expect(useDeckStore.getState().streakCount).toBe(1);
  });

  test("multiple grades on the same day do not double-count the streak", () => {
    const id1 = useDeckStore.getState().addCard({ en: "a", it: "a", cat: "altro" });
    const id2 = useDeckStore.getState().addCard({ en: "b", it: "b", cat: "altro" });
    useDeckStore.getState().gradeCorrect(id1);
    useDeckStore.getState().gradeCorrect(id2);
    useDeckStore.getState().gradeCorrect(id1);
    expect(useDeckStore.getState().streakCount).toBe(1);
  });
});

describe("deck store · importState", () => {
  test("replaces all current state with the imported deck", () => {
    const id1 = useDeckStore.getState().addCard({ en: "x", it: "x", cat: "altro" });
    expect(useDeckStore.getState().cards).toHaveLength(1);
    const incoming: DeckPayload = {
      cards: [{
        id: "imported", en: "the cat", it: "il gatto", cat: "sostantivo",
        rung: 0, charge: 0, due: 0, wrongs: 0, reviewed: 0, history: [],
        parentId: null, isChild: false, createdAt: 0,
      }],
      errors: [], sessions: [],
      streakLastDay: null, streakCount: 0, lastBackup: null,
    };
    useDeckStore.getState().importState(incoming);
    const cards = useDeckStore.getState().cards;
    expect(cards).toHaveLength(1);
    expect(cards[0]?.id).toBe("imported");
    expect(cards.find((c) => c.id === id1)).toBeUndefined();
  });
});

describe("deck store · mergeState", () => {
  test("dedupe cards by id (existing wins on collision)", () => {
    useDeckStore.getState().addCard({ en: "x", it: "x", cat: "altro" });
    const localId = useDeckStore.getState().cards[0]?.id;
    expect(localId).toBeDefined();
    const incoming: DeckPayload = {
      cards: [
        {
          id: localId!, en: "OVERWRITE", it: "x", cat: "altro",
          rung: 0, charge: 0, due: 0, wrongs: 0, reviewed: 0, history: [],
          parentId: null, isChild: false, createdAt: 0,
        },
        {
          id: "unique", en: "y", it: "y", cat: "altro",
          rung: 0, charge: 0, due: 0, wrongs: 0, reviewed: 0, history: [],
          parentId: null, isChild: false, createdAt: 0,
        },
      ],
      errors: [], sessions: [],
      streakLastDay: null, streakCount: 0, lastBackup: null,
    };
    useDeckStore.getState().mergeState(incoming);
    const cards = useDeckStore.getState().cards;
    expect(cards).toHaveLength(2);
    expect(cards.find((c) => c.id === localId)?.en).toBe("x");
    expect(cards.find((c) => c.id === "unique")).toBeDefined();
  });

  test("appends incoming errors chronologically (sorted by when)", () => {
    const incoming: DeckPayload = {
      cards: [],
      errors: [
        { cardId: "x", when: 3000, wrong: "c", correct: "x", ctx: "traduzione" },
        { cardId: "x", when: 1000, wrong: "a", correct: "x", ctx: "traduzione" },
        { cardId: "x", when: 2000, wrong: "b", correct: "x", ctx: "traduzione" },
      ],
      sessions: [],
      streakLastDay: null, streakCount: 0, lastBackup: null,
    };
    useDeckStore.getState().mergeState(incoming);
    expect(useDeckStore.getState().errors.map((e) => e.wrong)).toEqual(["a", "b", "c"]);
  });

  test("keeps MAX(local, imported) for streakCount", () => {
    useDeckStore.setState({ streakCount: 5 });
    useDeckStore.getState().mergeState({
      cards: [], errors: [], sessions: [],
      streakLastDay: null, streakCount: 12, lastBackup: null,
    });
    expect(useDeckStore.getState().streakCount).toBe(12);
    useDeckStore.setState({ streakCount: 20 });
    useDeckStore.getState().mergeState({
      cards: [], errors: [], sessions: [],
      streakLastDay: null, streakCount: 3, lastBackup: null,
    });
    expect(useDeckStore.getState().streakCount).toBe(20);
  });

  test("stamps lastBackup = Date.now() after merge", () => {
    const before = Date.now();
    useDeckStore.getState().mergeState({
      cards: [], errors: [], sessions: [],
      streakLastDay: null, streakCount: 0, lastBackup: null,
    });
    const after = Date.now();
    const lastBackup = useDeckStore.getState().lastBackup;
    expect(lastBackup).not.toBeNull();
    expect(lastBackup!).toBeGreaterThanOrEqual(before);
    expect(lastBackup!).toBeLessThanOrEqual(after);
  });
});
