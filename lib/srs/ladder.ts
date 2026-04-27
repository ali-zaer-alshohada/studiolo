import type { Card } from "./types";

/**
 * Studiolo's custom SRS ladder. Two ladders, two paces.
 *   LADDER_HOURS — normal cards: 3h → 6h → 1d → 3d → 6d
 *   CHILD_LADDER_HOURS — chained children: 1h → 4h → 1d (3 rungs only)
 *
 * Ported verbatim from prototype lines ~1810. The values are part of the design.
 */
export const LADDER_HOURS: readonly number[] = [3, 6, 24, 72, 144] as const;
export const CHILD_LADDER_HOURS: readonly number[] = [1, 4, 24] as const;
export const HOUR = 3_600_000;

function ladderFor(card: Card): readonly number[] {
  return card.isChild ? CHILD_LADDER_HOURS : LADDER_HOURS;
}

/**
 * Apply a correct-answer grading.
 * Bumps `rung` by 1 (capped at top), pushes `due` forward by ladder[rung] hours,
 * increments `reviewed`, appends a history entry. Pure — returns a new card.
 */
export function srsCorrect(card: Card, now: number): Card {
  const ladder = ladderFor(card);
  const rung = Math.min(card.rung + 1, ladder.length - 1);
  const hoursAhead = ladder[rung] ?? ladder[ladder.length - 1] ?? 0;
  return {
    ...card,
    rung,
    due: now + hoursAhead * HOUR,
    reviewed: card.reviewed + 1,
    history: [...card.history, { when: now, ok: true }],
  };
}

/**
 * Apply a wrong-answer grading.
 * Resets `rung` to 0, schedules `due` at ladder[0] hours from now, increments
 * `wrongs` and `reviewed`, appends a history entry recording what the user typed.
 * Pure — returns a new card.
 */
export function srsWrong(card: Card, wrongInput: string, now: number): Card {
  const ladder = ladderFor(card);
  const hoursAhead = ladder[0] ?? 0;
  return {
    ...card,
    rung: 0,
    due: now + hoursAhead * HOUR,
    wrongs: card.wrongs + 1,
    reviewed: card.reviewed + 1,
    history: [...card.history, { when: now, ok: false, wrong: wrongInput }],
  };
}
