"use client";

import { useDeckStore } from "@/lib/store/deck";
import { useUIStore } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ErrataLine } from "@/components/primitives";
import type { Card, ErrorEvent } from "@/lib/srs/types";

const N_ERRATA = 3;

function filterErrors(
  errors: ErrorEvent[],
  cards: Card[],
  filter: string,
): ErrorEvent[] {
  if (filter === "tutte") return errors;
  const cardById = new Map(cards.map((c) => [c.id, c]));
  if (filter === "deboli") {
    return errors.filter((e) => {
      const card = cardById.get(e.cardId);
      return card !== undefined && card.wrongs >= 2;
    });
  }
  // category filter
  return errors.filter((e) => cardById.get(e.cardId)?.cat === filter);
}

/**
 * The errata hero — the home view's typographic centerpiece. Shows up to N_ERRATA
 * recent errors, framed by heavy black rules. Internal hairlines (top + bottom of
 * the framed block) are part of the prototype's "printer's title block" feel.
 *
 * Empty-state copy is deliberately understated; the README says the errata IS
 * the reason you opened the app, but if there are none, we don't shout about it.
 */
export function ErrataHero() {
  const hydrated = useHydrated();
  const errors = useDeckStore((s) => s.errors);
  const cards = useDeckStore((s) => s.cards);
  const filter = useUIStore((s) => s.codaFilter);

  if (!hydrated) {
    return <div className="errata" aria-busy="true" />;
  }

  const filtered = filterErrors(errors, cards, filter);
  const top = [...filtered].sort((a, b) => b.when - a.when).slice(0, N_ERRATA);

  return (
    <div className="errata">
      <div className="head">
        <span className="title">
          <em>Errata</em> · in cui hai inciampato di recente
        </span>
        <span>{top.length === 1 ? "ultimo" : top.length > 1 ? `ultime ${top.length === 3 ? "tre" : top.length}` : ""}</span>
      </div>
      {top.length === 0 ? (
        <p className="errata-empty">
          <em>Nessun inciampo di recente.</em>{" "}
          {errors.length === 0 ? "Niente da revisionare ancora." : "Cambia il filtro per vederne altri."}
        </p>
      ) : (
        <div className="errata-list" role="list">
          {top.map((e, i) => (
            <ErrataLine
              key={`${e.cardId}-${e.when}`}
              index={i + 1}
              wrong={e.wrong}
              correct={e.correct}
              ctx={e.ctx}
              when={e.when}
            />
          ))}
        </div>
      )}
    </div>
  );
}
