"use client";

import clsx from "clsx";
import type { Card } from "@/lib/srs/types";
import { LADDER_HOURS, STACKS, CHILD_LADDER_HOURS } from "@/lib/srs/ladder";
import { toRoman } from "@/components/primitives";

type ApparatusProps = {
  card: Card;
};

function rungLabel(hours: number): string {
  if (hours < 24) return `${hours} ore`;
  const days = hours / 24;
  return days === 1 ? "1 giorno" : `${days} giorni`;
}

/**
 * Right-column apparatus. Shows the SRS ladder as a vertical roman-numeral
 * siglum with a per-rung track bar that visualizes the current card's
 * stack progress. Past rungs are fully filled; the current rung shows
 * `max(0, charge)` of `STACKS[rung]` segments; future rungs are empty.
 *
 * Negative charge ("losing ground") gets a small ↓ marker beside the bar.
 *
 * Children use the simpler legacy 3-rung ladder with single-segment bars
 * (the stacks model doesn't apply to children — see lib/srs/ladder.ts).
 */
export function Apparatus({ card }: ApparatusProps) {
  const ladder = card.isChild ? CHILD_LADDER_HOURS : LADDER_HOURS;
  const stacks = card.isChild ? ladder.map(() => 1) : STACKS;
  const losingGround = !card.isChild && card.charge < 0;

  return (
    <aside className="apparatus" aria-label="Apparato critico">
      <div className="app-block">
        <h4>Cammino</h4>
        <div className="ladder-vert">
          {ladder.map((hours, i) => {
            const state =
              i < card.rung ? "past" : i === card.rung ? "now" : "future";
            const segs = stacks[i] ?? 1;
            const filled =
              state === "past"
                ? segs
                : state === "now"
                  ? Math.max(0, Math.min(card.charge, segs))
                  : 0;
            return (
              <div className="rung" data-state={state} key={i}>
                <span className="siglum">{toRoman(i + 1)}</span>
                <span className="span">{rungLabel(hours)}</span>
                <span className="cammino-track" aria-hidden>
                  {state === "now" && losingGround && (
                    <span className="cammino-losing" title="losing ground">
                      ↓
                    </span>
                  )}
                  {Array.from({ length: segs }, (_, j) => (
                    <span
                      key={j}
                      className={clsx("cammino-segment", {
                        "is-filled": j < filled,
                      })}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {card.history.some((h) => !h.ok) && (
        <div className="app-block marginalia">
          <h4>Postille · {card.wrongs}</h4>
          {card.history
            .filter((h) => !h.ok)
            .slice(-4)
            .map((h, i) => (
              <div className="scholion" key={`${h.when}-${i}`}>
                <span className="key">
                  {toRoman(i + 1)} · {new Date(h.when).getDate()}
                </span>
                <span className="text">{h.wrong ?? ""}</span>
              </div>
            ))}
        </div>
      )}

      {card.isChild && (
        <div className="app-block">
          <h4>Postilla a</h4>
          <p style={{ fontStyle: "italic", color: "var(--fg)", margin: 0 }}>
            {card.ctx ?? "—"}
          </p>
        </div>
      )}
    </aside>
  );
}
