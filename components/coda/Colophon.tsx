"use client";

import { useDeckStore, selectDueCount } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Card } from "@/lib/srs/types";

const SEVEN_DAYS_MS = 7 * 86_400_000;

/**
 * Computes accuracy over the last 7 days from card history.
 * Returns null if there's no review activity in the window.
 */
function sevenDayAccuracy(cards: Card[]): number | null {
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  let right = 0;
  let total = 0;
  for (const card of cards) {
    for (const h of card.history) {
      if (h.when < cutoff) continue;
      total++;
      if (h.ok) right++;
    }
  }
  if (total === 0) return null;
  return right / total;
}

/**
 * Coda's footer — 4 stats in mono small-caps, framed top-only by a 2px black rule.
 * tot · oggi · serie · esattezza · 7g
 */
export function Colophon() {
  const hydrated = useHydrated();
  const cardCount = useDeckStore((s) => s.cards.length);
  const due = useDeckStore(selectDueCount);
  const streak = useDeckStore((s) => s.streakCount);
  const cards = useDeckStore((s) => s.cards);

  const accuracy = hydrated ? sevenDayAccuracy(cards) : null;
  const accuracyText = accuracy === null ? "—" : `${Math.round(accuracy * 100)}%`;
  const streakText = streak > 0 ? `${streak}g` : "—";

  return (
    <div className="colophon" aria-label="Riepilogo">
      <div className="stat">
        <span>tot</span>
        <span className="v">{hydrated ? cardCount : "—"}</span>
      </div>
      <div className="stat">
        <span>oggi</span>
        <span className="v">{hydrated ? due : "—"}</span>
      </div>
      <div className="stat">
        <span>serie</span>
        <span className="v">{hydrated ? streakText : "—"}</span>
      </div>
      <div className="stat">
        <span>esattezza · 7g</span>
        <span className="v">{accuracyText}</span>
      </div>
    </div>
  );
}
