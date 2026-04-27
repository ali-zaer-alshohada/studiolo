import type { Card } from "./types";

/**
 * Cards whose due time is at or before `now`. Pure; does not mutate input.
 *
 * Note: the prototype's selection is intentionally simple — it does NOT
 * special-case children-of-active-parents. The Studiare quiz UI is responsible
 * for rendering chained children as footnotes on their parent rather than as
 * standalone cards in the visible queue. Keeping the queue selection naive
 * keeps the math testable and the rules predictable.
 */
export function dueToday(cards: ReadonlyArray<Card>, now: number): Card[] {
  return cards.filter((c) => c.due <= now);
}

/**
 * Pure Fisher-Yates shuffle. Takes an injectable rng so tests are deterministic
 * and the quiz can use Math.random in production.
 */
export function shuffle<T>(arr: ReadonlyArray<T>, rng: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}
