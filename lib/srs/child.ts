import type { Card } from "./types";

/**
 * Decide whether a chained child should be spawned for this card after a wrong.
 *
 * Rules:
 *   1. The card must NOT already be a child (no grandchildren — flat hierarchy).
 *   2. The card must have ≥ 2 lifetime wrongs (one mistake doesn't earn extra attention).
 *   3. No existing child for the same (parentId, ctx) pair — don't double-spawn.
 *
 * The ctx is the *kind* of error ("genere", "ausiliare", "preposizione", "dettatura").
 * A card can have multiple children, one per distinct ctx.
 */
export function shouldSpawnChild(
  card: Card,
  allCards: ReadonlyArray<Card>,
  ctx: string,
): boolean {
  if (card.isChild) return false;
  if (card.wrongs < 2) return false;
  const existing = allCards.some(
    (c) => c.parentId === card.id && c.ctx === ctx,
  );
  return !existing;
}

let childIdCounter = 0;

/**
 * Build a child card from a parent + ctx. Inherits en/it/cat; gets a fresh id,
 * parentId set, isChild = true, rung 0, due immediately, and the ctx tagged.
 *
 * Pure (does not mutate parent or any other state).
 */
export function makeChild(parent: Card, ctx: string, now: number): Card {
  childIdCounter++;
  return {
    id: `child-${parent.id}-${ctx}-${now.toString(36)}-${childIdCounter.toString(36)}`,
    en: parent.en,
    it: parent.it,
    cat: parent.cat,
    ctx,
    rung: 0,
    charge: 0,
    due: now,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: parent.id,
    isChild: true,
    createdAt: now,
  };
}
