"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useUIStore } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ErratumSlot } from "@/components/coda/ErratumSlot";
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

  // On match: dismiss the matched item immediately (so the queue shifts) AND
  // advance the active key to the next item. The ErratumSlot keeps the old
  // content rendered locally for 520ms while it animates the swap, so the
  // user still sees a smooth transition. Slots themselves stay in their
  // fixed positions — only the words inside each slot move.
  const handleMatched = useCallback(
    (key: string, slotIdx: number, queue: ErrorEvent[]) => {
      const next = queue[slotIdx + 1];
      setActiveKey(next ? errKey(next) : null);
      setDismissed((prev) => {
        const set = new Set(prev);
        set.add(key);
        return set;
      });
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
          {Array.from({ length: N_ERRATA }, (_, slotIdx) => {
            const e = top[slotIdx];
            const item = e
              ? {
                  key: errKey(e),
                  index: slotIdx + 1,
                  wrong: e.wrong,
                  correct: e.correct,
                  ctx: e.ctx,
                  when: e.when,
                }
              : null;
            const itemKey = item?.key ?? null;
            return (
              <ErratumSlot
                key={slotIdx}
                slotIdx={slotIdx}
                item={item}
                isActive={itemKey !== null && activeKey === itemKey}
                onActivate={() => itemKey && setActiveKey(itemKey)}
                onMatched={() => itemKey && handleMatched(itemKey, slotIdx, visible)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
