import type { Card } from "./types";

/**
 * Studiolo's stacks-based SRS ladder.
 *
 * Five rungs i / ii / iii / iv / v with intervals 3h · 1d · 3d · 1w · 21d.
 * Each rung has a "stacks" budget (`STACKS`) that the card's `charge` counter
 * works against — a signed integer that resets to 0 on every promotion or
 * demotion.
 *
 *   right answer → charge += 1; if charge ≥ STACKS[rung] → promote (rung++)
 *   wrong answer → charge -= 1; if charge ≤ -STACKS[rung] → demote (rung--)
 *
 * Boundary cases:
 *   - rung i (0): floor. Wrong stays at i and reschedules in 3h; charge=0.
 *   - rung v (4): single-shot top. The first right grants the certificate
 *     (`card.collected = { when }`). Future rights just re-cycle 21d. Wrong
 *     at v demotes straight to iv.
 *
 * Chained children use the simpler tighter ladder (`CHILD_LADDER_HOURS`)
 * and the original "wrong resets to 0" behavior — the stacks model is
 * intentionally for the main ladder only.
 */
export const LADDER_HOURS: readonly number[] = [3, 24, 72, 168, 504] as const;
export const STACKS: readonly number[] = [1, 2, 3, 2, 1] as const;
export const CHILD_LADDER_HOURS: readonly number[] = [1, 4, 24] as const;
export const HOUR = 3_600_000;

/** Index of the top rung (rung v) in LADDER_HOURS. */
const TOP_RUNG = LADDER_HOURS.length - 1;

/**
 * Apply a correct-answer grading. Pure — returns a new Card.
 *
 * Branches on `card.isChild`:
 *   - children use the simple advance-and-cap model
 *   - main cards use the stacks model (with v special-cased for the certificate)
 */
export function srsCorrect(card: Card, now: number): Card {
  if (card.isChild) return srsCorrectChild(card, now);

  const base = {
    ...card,
    reviewed: card.reviewed + 1,
    history: [...card.history, { when: now, ok: true as const }],
  };

  // Rung v: single shot. First right grants the certificate; charge never
  // accumulates here. Card stays at v, re-cycling every 21d.
  if (card.rung === TOP_RUNG) {
    return {
      ...base,
      charge: 0,
      due: now + (LADDER_HOURS[TOP_RUNG] ?? 0) * HOUR,
      collected: card.collected ?? { when: now },
    };
  }

  const newCharge = card.charge + 1;
  const threshold = STACKS[card.rung] ?? 1;

  if (newCharge >= threshold) {
    // Promote
    const newRung = card.rung + 1;
    return {
      ...base,
      rung: newRung,
      charge: 0,
      due: now + (LADDER_HOURS[newRung] ?? 0) * HOUR,
    };
  }

  // Stay at this rung, charge increments. Re-cycle at the rung's interval.
  return {
    ...base,
    charge: newCharge,
    due: now + (LADDER_HOURS[card.rung] ?? 0) * HOUR,
  };
}

/**
 * Apply a wrong-answer grading. Pure — returns a new Card.
 */
export function srsWrong(card: Card, wrongInput: string, now: number): Card {
  if (card.isChild) return srsWrongChild(card, wrongInput, now);

  const base = {
    ...card,
    wrongs: card.wrongs + 1,
    reviewed: card.reviewed + 1,
    history: [
      ...card.history,
      { when: now, ok: false as const, wrong: wrongInput },
    ],
  };

  // Rung i (floor): stay, repeat in 3h. Charge stays 0 — can't go lower.
  if (card.rung === 0) {
    return {
      ...base,
      charge: 0,
      due: now + (LADDER_HOURS[0] ?? 0) * HOUR,
    };
  }

  // Rung v: any wrong demotes to iv. Single-shot; no charge accumulation.
  if (card.rung === TOP_RUNG) {
    const newRung = TOP_RUNG - 1;
    return {
      ...base,
      rung: newRung,
      charge: 0,
      due: now + (LADDER_HOURS[newRung] ?? 0) * HOUR,
    };
  }

  const newCharge = card.charge - 1;
  const threshold = -(STACKS[card.rung] ?? 1);

  if (newCharge <= threshold) {
    // Demote
    const newRung = card.rung - 1;
    return {
      ...base,
      rung: newRung,
      charge: 0,
      due: now + (LADDER_HOURS[newRung] ?? 0) * HOUR,
    };
  }

  // Stay at this rung, charge decrements. Re-cycle at the rung's interval.
  return {
    ...base,
    charge: newCharge,
    due: now + (LADDER_HOURS[card.rung] ?? 0) * HOUR,
  };
}

// ─── Chained-children helpers (simple advance / reset model) ───────────

function srsCorrectChild(card: Card, now: number): Card {
  const ladder = CHILD_LADDER_HOURS;
  const newRung = Math.min(card.rung + 1, ladder.length - 1);
  return {
    ...card,
    rung: newRung,
    charge: 0, // children don't use the stacks model
    due: now + (ladder[newRung] ?? 0) * HOUR,
    reviewed: card.reviewed + 1,
    history: [...card.history, { when: now, ok: true }],
  };
}

function srsWrongChild(card: Card, wrongInput: string, now: number): Card {
  const ladder = CHILD_LADDER_HOURS;
  return {
    ...card,
    rung: 0,
    charge: 0,
    due: now + (ladder[0] ?? 0) * HOUR,
    wrongs: card.wrongs + 1,
    reviewed: card.reviewed + 1,
    history: [...card.history, { when: now, ok: false, wrong: wrongInput }],
  };
}
