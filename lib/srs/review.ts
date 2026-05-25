import type { Card } from "./types";
import { LADDER_HOURS, CHILD_LADDER_HOURS, HOUR } from "./ladder";

/**
 * Self-grade review model for /studiare — no typed exam. After revealing the
 * answer the user picks one of three colours, each choosing the next due date:
 *
 *   rosso  → down one rung  · also logs a miss + drops the card into gioco
 *   giallo → hold           · stay at the current rung
 *   blu    → up one rung    · climbs (interval grows as the rung rises)
 *
 * Symmetric ladder walk: rosso ↓1, giallo =, blu ↑1, clamped to [0, top].
 *
 * Intervals come from the existing LADDER_HOURS (main) / CHILD_LADDER_HOURS
 * (chained children), so blu keeps stretching as a card climbs. The `charge`
 * (stacks) field is irrelevant here and is zeroed — stacks belong to the old
 * typed exam, still used by gioco/dettatura via srsCorrect/srsWrong.
 */
export type ReviewGrade = "rosso" | "giallo" | "blu";

function ladderFor(card: Card): readonly number[] {
  return card.isChild ? CHILD_LADDER_HOURS : LADDER_HOURS;
}

/**
 * Target rung for a grade — a single step on the ladder:
 *   rosso  → r − 1   (down one, floored at 0)
 *   giallo → r       (hold)
 *   blu    → r + 1   (up one, capped at the top rung)
 *
 * At the floor (r = 0) rosso and giallo coincide on rung 0 — you can't descend
 * below it — but rosso still logs the miss + games the card (see deck.reviewCard).
 */
function targetRung(card: Card, grade: ReviewGrade): number {
  const ladder = ladderFor(card);
  const top = ladder.length - 1;
  const r = Math.min(Math.max(card.rung, 0), top);
  if (grade === "rosso") return Math.max(r - 1, 0);
  if (grade === "giallo") return r;
  return Math.min(r + 1, top); // blu
}

/** Hours until the card is next due for a given grade. Pure — drives the button preview. */
export function reviewIntervalHours(card: Card, grade: ReviewGrade): number {
  const ladder = ladderFor(card);
  return ladder[targetRung(card, grade)] ?? 0;
}

/** Apply a self-grade. Pure — returns a new Card. Error logging / child spawning
 *  on a rosso lives in the deck store (reviewCard), not here. */
export function reviewedCard(card: Card, grade: ReviewGrade, now: number): Card {
  const rung = targetRung(card, grade);
  const hours = reviewIntervalHours(card, grade);
  const ok = grade !== "rosso";
  return {
    ...card,
    rung,
    charge: 0,
    due: now + hours * HOUR,
    reviewed: card.reviewed + 1,
    wrongs: grade === "rosso" ? card.wrongs + 1 : card.wrongs,
    history: [...card.history, { when: now, ok }],
  };
}

/** Render an interval (hours) as an Italian "fra …" phrase for the grade buttons. */
export function formatIntervalIt(hours: number): string {
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours));
    return `fra ${h} ${h === 1 ? "ora" : "ore"}`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) return `fra ${days} ${days === 1 ? "giorno" : "giorni"}`;
  const weeks = Math.round(days / 7);
  return `fra ${weeks} ${weeks === 1 ? "settimana" : "settimane"}`;
}
