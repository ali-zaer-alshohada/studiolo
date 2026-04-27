"use client";

import type { Card } from "@/lib/srs/types";
import { LADDER_HOURS, CHILD_LADDER_HOURS } from "@/lib/srs/ladder";
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
 * siglum with the current rung highlighted, plus marginalia (recent wrongs)
 * and a child-of indicator if this card is itself a chained child.
 */
export function Apparatus({ card }: ApparatusProps) {
  const ladder = card.isChild ? CHILD_LADDER_HOURS : LADDER_HOURS;

  return (
    <aside className="apparatus" aria-label="Apparato critico">
      <div className="app-block">
        <h4>Cammino</h4>
        <div className="ladder-vert">
          {ladder.map((hours, i) => {
            const state =
              i < card.rung ? "past" : i === card.rung ? "now" : "future";
            return (
              <div className="rung" data-state={state} key={i}>
                <span className="siglum">{toRoman(i + 1)}</span>
                <span className="span">{rungLabel(hours)}</span>
                <span className="dot" aria-hidden />
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
