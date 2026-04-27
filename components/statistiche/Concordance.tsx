"use client";

import { useMemo } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { buildConcordance } from "@/lib/srs/concordance";

/**
 * The alphabetical concordance — the most "critical edition" view in the app.
 * Rendered as a back-of-book index: each letter is its own group with a heavy
 * italic Iowan header; rows are `wrong → correct  ×N`.
 *
 * Wrapped in a <details> per letter group so long indices stay scannable.
 */
export function Concordance() {
  const hydrated = useHydrated();
  const errors = useDeckStore((s) => s.errors);

  const groups = useMemo(() => (hydrated ? buildConcordance(errors) : []), [hydrated, errors]);

  if (!hydrated) {
    return <div className="conc-list" aria-busy="true" />;
  }

  if (groups.length === 0) {
    return (
      <div className="conc-empty">
        <em>Nessun errore registrato.</em> La concordanza si scrive da sé, sbagliando.
      </div>
    );
  }

  return (
    <div className="conc-list">
      {groups.map((group, i) => (
        <details className="letter-group" key={group.letter} open={i === 0}>
          <summary className="letter-head">
            <em>{group.letter}</em>
            <span className="letter-count">· {group.entries.length}</span>
          </summary>
          <div className="letter-body">
            {group.entries.map((e, i) => (
              <div className="erratum-row" key={`${e.wrong}→${e.correct}-${i}`}>
                <span className="er-wrong">{e.wrong}</span>
                <span className="er-arrow" aria-hidden>→</span>
                <span className="er-corr">{e.correct}</span>
                <span className="er-freq">×{e.count}</span>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
