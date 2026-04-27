import type { ErrorEvent } from "./types";
import { normalize } from "@/lib/text/normalize";

export type ConcordanceEntry = {
  /** The user's wrong answer, verbatim (not normalized — for display). */
  wrong: string;
  /** The canonical correct answer, verbatim. */
  correct: string;
  /** How many times this exact (wrong → correct) pair has occurred. */
  count: number;
  /** Epoch ms of the most recent occurrence. */
  lastSeen: number;
};

export type LetterGroup = {
  /** Uppercase first letter, or "·" for empty/non-letter wrong strings. */
  letter: string;
  /** Entries within this letter group, sorted by frequency descending. */
  entries: ConcordanceEntry[];
};

/**
 * Build the alphabetical concordance from an error log.
 *
 * Algorithm (matches prototype line 2531):
 *   1. Normalize each error's wrong answer (to extract the first letter).
 *   2. Group by uppercase first letter; "·" for empty/punctuation-only wrongs.
 *   3. Within each group, dedupe by (normalized wrong, normalized correct);
 *      count occurrences and track most-recent timestamp.
 *   4. Sort groups alphabetically using Italian collation.
 *   5. Sort entries within each group by frequency descending.
 *
 * Pure.
 */
export function buildConcordance(errors: ReadonlyArray<ErrorEvent>): LetterGroup[] {
  if (errors.length === 0) return [];

  // Group: letter → (wrong→correct key) → entry
  const byLetter = new Map<string, Map<string, ConcordanceEntry>>();

  for (const e of errors) {
    const normWrong = normalize(e.wrong);
    const firstChar = normWrong[0];
    const letter =
      firstChar !== undefined && /[a-zà-ÿ]/i.test(firstChar)
        ? firstChar.toUpperCase()
        : "·";

    let bucket = byLetter.get(letter);
    if (!bucket) {
      bucket = new Map();
      byLetter.set(letter, bucket);
    }

    const key = `${normalize(e.wrong)}→${normalize(e.correct)}`;
    const existing = bucket.get(key);
    if (existing) {
      existing.count++;
      existing.lastSeen = Math.max(existing.lastSeen, e.when);
    } else {
      bucket.set(key, {
        wrong: e.wrong,
        correct: e.correct,
        count: 1,
        lastSeen: e.when,
      });
    }
  }

  const collator = new Intl.Collator("it", { sensitivity: "base" });

  return Array.from(byLetter.entries())
    .sort(([a], [b]) => {
      // "·" sorts last
      if (a === "·" && b !== "·") return 1;
      if (b === "·" && a !== "·") return -1;
      return collator.compare(a, b);
    })
    .map(([letter, bucket]) => ({
      letter,
      entries: Array.from(bucket.values()).sort((x, y) => y.count - x.count),
    }));
}
