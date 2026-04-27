"use client";

import { useDeckStore, selectDueCount } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Card } from "@/lib/srs/types";

const SEVEN_DAYS_MS = 7 * 86_400_000;

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
 * Top-of-page totals row for Statistiche.
 *   tot. carte · errori · serie · esattezza · 7g
 * Each box is a `.ct` (concordance-total) cell with a small mono label and a
 * large italic Iowan value.
 */
export function StatTotals() {
  const hydrated = useHydrated();
  const cards = useDeckStore((s) => s.cards);
  const errors = useDeckStore((s) => s.errors);
  const due = useDeckStore(selectDueCount);
  const streak = useDeckStore((s) => s.streakCount);

  const accuracy = hydrated ? sevenDayAccuracy(cards) : null;
  const accuracyText = accuracy === null ? "—" : `${Math.round(accuracy * 100)}%`;
  const streakText = streak > 0 ? `${streak}g` : "—";

  return (
    <div className="conc-totals" aria-label="Riepilogo">
      <div className="ct">
        <span className="lbl">tot. carte</span>
        <span className="v">{hydrated ? cards.length : "—"}</span>
      </div>
      <div className="ct">
        <span className="lbl">errori</span>
        <span className="v">{hydrated ? errors.length : "—"}</span>
      </div>
      <div className="ct">
        <span className="lbl">serie</span>
        <span className="v">{hydrated ? streakText : "—"}</span>
      </div>
      <div className="ct">
        <span className="lbl">esattezza · 7g</span>
        <span className="v">{accuracyText}</span>
      </div>
      <div className="ct">
        <span className="lbl">oggi</span>
        <span className="v">{hydrated ? due : "—"}</span>
      </div>
    </div>
  );
}
