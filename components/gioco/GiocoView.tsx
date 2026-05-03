"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Card } from "@/lib/srs/types";

const BOARD_SIZE = 16;
const PAIR_COUNT = 8;
const NO_MATCH_DELAY_MS = 1000;
const MATCH_FADE_DELAY_MS = 600;

/** A single board cell — either a card-side or an empty slot (pool exhausted). */
type Cell =
  | {
      kind: "card";
      cardId: string;
      side: "en" | "it";
      text: string;
      revealed: boolean;
    }
  | { kind: "empty" };

/** Cards eligible for the gioco pool. */
export function selectGiocoPool(cards: ReadonlyArray<Card>): Card[] {
  return cards.filter((c) => (c.giocoLives ?? 0) > 0);
}

function shuffle<T>(arr: ReadonlyArray<T>): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

function buildPair(card: Card): [Cell, Cell] {
  return [
    { kind: "card", cardId: card.id, side: "en", text: card.en, revealed: false },
    { kind: "card", cardId: card.id, side: "it", text: card.it, revealed: false },
  ];
}

/** Fill the 16-cell board from the pool. Pads with empties if pool < 8. */
export function buildBoard(pool: ReadonlyArray<Card>): Cell[] {
  const sample = shuffle(pool).slice(0, PAIR_COUNT);
  const cells: Cell[] = sample.flatMap(buildPair);
  while (cells.length < BOARD_SIZE) {
    cells.push({ kind: "empty" });
  }
  return shuffle(cells);
}

/** True when every cell is empty — i.e., all pairs have been matched and faded. */
function isBoardCleared(cells: ReadonlyArray<Cell>): boolean {
  if (cells.length === 0) return false;
  return cells.every((c) => c.kind === "empty");
}

export function GiocoView() {
  const hydrated = useHydrated();
  const cards = useDeckStore((s) => s.cards);
  const gradeGiocoMatch = useDeckStore((s) => s.gradeGiocoMatch);

  const pool = useMemo(() => selectGiocoPool(cards), [cards]);

  const [cells, setCells] = useState<Cell[]>([]);
  // Refs avoid stale-closure bugs in setTimeout callbacks.
  const selectedIdxRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);
  const initializedRef = useRef(false);

  // Build the initial board once after hydration. Won't re-init if pool grows
  // mid-game (just leaves the new cards for the next session start).
  useEffect(() => {
    if (!hydrated || initializedRef.current) return;
    if (pool.length > 0) {
      setCells(buildBoard(pool));
      initializedRef.current = true;
    }
  }, [hydrated, pool]);

  function startNewGame() {
    // Rebuild from the latest pool — the previous game's matches have already
    // decremented giocoLives, so cards may have left or stayed.
    const fresh = selectGiocoPool(useDeckStore.getState().cards);
    setCells(buildBoard(fresh));
    selectedIdxRef.current = null;
    cooldownRef.current = false;
  }

  if (!hydrated) {
    return <div className="gioco" aria-busy="true" />;
  }

  if (pool.length === 0) {
    return (
      <p className="gioco-empty">
        <em>Niente di sbagliato da rivedere.</em> Il pool del gioco si riempie
        quando sbagli in <em>traduzione</em> o <em>coniugazione</em> — torna
        dopo qualche errore.
      </p>
    );
  }

  function handleClick(idx: number) {
    if (cooldownRef.current) return;
    setCells((prev) => {
      const cell = prev[idx];
      if (!cell || cell.kind !== "card" || cell.revealed) return prev;

      // First flip
      if (selectedIdxRef.current === null) {
        selectedIdxRef.current = idx;
        return prev.map((x, i) =>
          i === idx && x.kind === "card" ? { ...x, revealed: true } : x,
        );
      }

      // Second flip
      const firstIdx = selectedIdxRef.current;
      const first = prev[firstIdx];
      if (!first || first.kind !== "card" || firstIdx === idx) {
        selectedIdxRef.current = null;
        return prev;
      }

      const flippedSecond = prev.map((x, i) =>
        i === idx && x.kind === "card" ? { ...x, revealed: true } : x,
      );

      const isMatch =
        first.cardId === cell.cardId && first.side !== cell.side;

      if (isMatch) {
        cooldownRef.current = true;
        gradeGiocoMatch(cell.cardId);
        // Brief pause for the user to register the match, then fade out.
        // No replacement — matched pairs just leave the board. When all
        // 8 pairs are matched the board is empty and we show the
        // "complimenti" celebration with a restart button.
        window.setTimeout(() => {
          setCells((c) => {
            const next = [...c];
            next[firstIdx] = { kind: "empty" };
            next[idx] = { kind: "empty" };
            return next;
          });
          selectedIdxRef.current = null;
          cooldownRef.current = false;
        }, MATCH_FADE_DELAY_MS);
      } else {
        // No match — flip both back after a beat
        cooldownRef.current = true;
        window.setTimeout(() => {
          setCells((c) =>
            c.map((x, i) =>
              (i === idx || i === firstIdx) && x.kind === "card"
                ? { ...x, revealed: false }
                : x,
            ),
          );
          selectedIdxRef.current = null;
          cooldownRef.current = false;
        }, NO_MATCH_DELAY_MS);
      }

      return flippedSecond;
    });
  }

  const remaining = pool.reduce((sum, c) => sum + (c.giocoLives ?? 0), 0);
  const cleared = isBoardCleared(cells);

  return (
    <>
      <p className="gioco-prompt">
        <em>Trova le coppie</em> · ogni partita restituisce una vita in CAMMINO ·{" "}
        <span className="gioco-pool-count">{pool.length}</span> carte ·{" "}
        <span className="gioco-pool-count">{remaining}</span> vite
      </p>
      {cleared && (
        <div className="gioco-cleared" role="status" aria-live="polite">
          <p className="gioco-cleared-msg">
            <em>Complimenti.</em> Hai trovato tutte le coppie.
          </p>
          {pool.length > 0 ? (
            <button type="button" className="avanti-btn" onClick={startNewGame}>
              Ricomincia ↻
            </button>
          ) : (
            <p className="gioco-cleared-hint">
              Il pool è vuoto — nessun errore da rivedere. Studia di più (o
              sbaglia di più) per riempirlo.
            </p>
          )}
        </div>
      )}
      <div className="gioco-grid" role="grid" aria-label="Gioco di memoria">
        {cells.map((cell, idx) => {
          const isCard = cell.kind === "card";
          const isRevealed = isCard && cell.revealed;
          return (
            <button
              key={idx}
              type="button"
              className={clsx("gioco-card", {
                "is-revealed": isRevealed,
                "is-empty": !isCard,
              })}
              onClick={() => handleClick(idx)}
              disabled={!isCard}
              aria-label={
                isCard
                  ? isRevealed
                    ? cell.text
                    : `carta ${idx + 1}`
                  : `slot vuoto ${idx + 1}`
              }
            >
              <span className="gioco-back" aria-hidden>
                ·
              </span>
              <span className="gioco-front" aria-hidden={!isRevealed}>
                {isCard ? cell.text : ""}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
