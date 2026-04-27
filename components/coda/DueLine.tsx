"use client";

import { useDeckStore, selectDueCount } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";

/**
 * One-line summary, demoted below the errata hero per the design rule:
 * "Do not promote the count; do not demote the errata."
 *
 * Shape: [N] carte da rivedere oggi. ……… serie · 12g
 */
export function DueLine() {
  const hydrated = useHydrated();
  const due = useDeckStore(selectDueCount);
  const streak = useDeckStore((s) => s.streakCount);

  if (!hydrated) {
    return <div className="due-line" aria-busy="true" />;
  }

  return (
    <div className="due-line">
      <span className={due === 0 ? "count zero" : "count"}>{due}</span>
      <span className="body">
        {due === 1
          ? "carta da rivedere oggi."
          : "carte da rivedere oggi."}
      </span>
      <span className="streak">
        serie · <span className="v">{streak > 0 ? `${streak}g` : "—"}</span>
      </span>
    </div>
  );
}
