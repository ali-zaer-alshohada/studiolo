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

/**
 * Clamp a session's queue size to [min, max].
 *
 * - Above `max`: take the `max` most-overdue (sort by `due` ascending).
 * - Below `min`: pad with brand-new cards (`reviewed === 0`), oldest
 *   `createdAt` first, drawn from `pool` and skipping any card already in
 *   `due` or any paragraph card. If still under `min` after that, ship
 *   what we have — better honest under-target than artificial filler.
 *
 * `pool` is the larger eligible-card universe (typically the deck after
 * mode filtering). The caller is responsible for any mode/category narrowing
 * before this is called.
 */
export function clampSession(
  due: ReadonlyArray<Card>,
  pool: ReadonlyArray<Card>,
  min: number,
  max: number,
): Card[] {
  if (due.length > max) {
    return [...due].sort((a, b) => a.due - b.due).slice(0, max);
  }
  if (due.length >= min) {
    return [...due];
  }
  const dueIds = new Set(due.map((c) => c.id));
  const candidates = pool
    .filter((c) => c.reviewed === 0)
    .filter((c) => c.paragraph === undefined)
    .filter((c) => !dueIds.has(c.id))
    .sort((a, b) => a.createdAt - b.createdAt);
  const need = min - due.length;
  return [...due, ...candidates.slice(0, need)];
}
