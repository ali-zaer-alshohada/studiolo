import type { Card } from "./types";
import { normalize } from "@/lib/text/normalize";

const SENTENCE_MIN_WORDS = 2;

/**
 * Pick a card for the dictation drill. Prefers sentence-length cards (2+ words);
 * falls back to any card if no sentences exist. Returns null if the deck is empty.
 *
 * Pure — takes an injectable rng so tests are deterministic.
 */
export function pickDettaturaCard(
  cards: ReadonlyArray<Card>,
  rng: () => number = Math.random,
): Card | null {
  if (cards.length === 0) return null;
  const sentences = cards.filter(
    (c) => c.it.split(/\s+/).filter(Boolean).length >= SENTENCE_MIN_WORDS,
  );
  const pool = sentences.length > 0 ? sentences : cards;
  const idx = Math.floor(rng() * pool.length);
  return pool[Math.min(idx, pool.length - 1)] ?? null;
}

export type DiffKind = "ok" | "miss";
export type WordDiff = { word: string; kind: DiffKind };

export type DettaturaResult = {
  ok: boolean;
  target: string;
  yours: string;
  /** Word-by-word diff. Length is the number of words the USER typed. */
  diff: WordDiff[];
};

/**
 * Grade a dictation attempt. Whole-string match decides `ok`. The diff[]
 * is built per-user-word against the target at the same index — used to
 * style each word as either kept (ok) or struck-through (miss) in the
 * feedback area.
 *
 * Pure.
 */
export function gradeDettatura(card: Card, input: string): DettaturaResult {
  const target = card.it;
  const yours = input.trim();
  const ok = normalize(yours) === normalize(target);

  const targetWords = target.split(/\s+/).filter(Boolean);
  const yourWords = yours.split(/\s+/).filter(Boolean);

  const diff: WordDiff[] = yourWords.map((word, i) => {
    const targetWord = targetWords[i] ?? "";
    const matches = normalize(word) === normalize(targetWord) && targetWord !== "";
    return { word, kind: matches ? "ok" : "miss" };
  });

  return { ok, target, yours, diff };
}
