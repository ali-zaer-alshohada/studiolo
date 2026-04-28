"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useUIStore } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { Erratum } from "@/components/coda/Erratum";
import type { Card, ErrorEvent } from "@/lib/srs/types";

const N_ERRATA = 3;

function errKey(e: ErrorEvent): string {
  return `${e.cardId}-${e.when}`;
}

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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Dismiss a row and auto-advance the active key to whatever fills the
  // emptied slot — so typing through the queue stays seamless. Only an
  // outside click or Esc (handled below) breaks the active mode.
  const resolveSlot = useCallback(
    (key: string, slotIdx: number, queue: ErrorEvent[]) => {
      const next = queue[slotIdx + 1];
      setDismissed((prev) => {
        const set = new Set(prev);
        set.add(key);
        return set;
      });
      setActiveKey(next ? errKey(next) : null);
    },
    [],
  );

  // Click outside the errata-list (or press Esc) deactivates the active row.
  useEffect(() => {
    if (activeKey === null) return;
    function onPointerDown(ev: MouseEvent) {
      if (!listRef.current) return;
      if (!listRef.current.contains(ev.target as Node)) {
        setActiveKey(null);
      }
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setActiveKey(null);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [activeKey]);

  if (!hydrated) {
    return <div className="errata" aria-busy="true" />;
  }

  const filtered = filterErrors(errors, cards, filter);
  const visible = [...filtered]
    .sort((a, b) => b.when - a.when)
    .filter((e) => !dismissed.has(errKey(e)));
  const top = visible.slice(0, N_ERRATA);

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
        <div className="errata-list" role="list" ref={listRef}>
          {top.map((e, i) => {
            const key = errKey(e);
            return (
              <Erratum
                key={key}
                index={i + 1}
                wrong={e.wrong}
                correct={e.correct}
                ctx={e.ctx}
                when={e.when}
                isActive={activeKey === key}
                onActivate={() => setActiveKey(key)}
                onResolved={() => resolveSlot(key, i, visible)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
