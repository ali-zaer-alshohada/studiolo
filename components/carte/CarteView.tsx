"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Card, Category } from "@/lib/srs/types";

const ROMAN_RUNGS = ["i", "ii", "iii", "iv", "v"] as const;
const CATEGORIES: ReadonlyArray<{ key: Category | "tutte"; label: string }> = [
  { key: "tutte", label: "tutte" },
  { key: "sostantivo", label: "sostantivi" },
  { key: "verbo", label: "verbi" },
  { key: "pronome", label: "pronomi" },
  { key: "preposizione", label: "preposizioni" },
  { key: "aggettivo", label: "aggettivi" },
  { key: "altro", label: "altro" },
];

function rungIndicator(card: Card): string {
  if (card.paragraph !== undefined) return "—";
  return ROMAN_RUNGS[card.rung] ?? `${card.rung + 1}`;
}

/**
 * Browse the entire deck. Live-filters by `q` (substring of en or it) and
 * by category chip. Click a row to navigate to /aggiungi?edit=<id>; the
 * Aggiungi view reads that param and pre-fills the form for editing.
 */
export function CarteView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const cards = useDeckStore((s) => s.cards);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["key"]>("tutte");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cards
      .filter((c) => (cat === "tutte" ? true : c.cat === cat))
      .filter((c) => {
        if (needle === "") return true;
        return (
          c.en.toLowerCase().includes(needle) ||
          c.it.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [cards, q, cat]);

  if (!hydrated) {
    return <div className="carte" aria-busy="true" />;
  }

  return (
    <div className="carte">
      <div className="carte-controls">
        <input
          type="search"
          className="carte-search"
          placeholder="cerca · inglese o italiano"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cerca nelle carte"
          autoFocus
        />
        <span className="carte-count">
          {filtered.length} {filtered.length === 1 ? "carta" : "carte"}
        </span>
      </div>

      <div className="carte-cats" role="group" aria-label="Filtra per categoria">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className="carte-cat-chip"
            data-active={cat === c.key ? "1" : undefined}
            onClick={() => setCat(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="carte-empty">
          <em>Nessuna carta corrisponde.</em>{" "}
          {cards.length === 0
            ? "Il mazzo è vuoto."
            : "Cambia ricerca o filtro per vederne altre."}
        </p>
      ) : (
        <div className="carte-list">
          {filtered.map((c) => (
            <button
              type="button"
              className="ar-row"
              key={c.id}
              onClick={() => router.push(`/aggiungi?edit=${c.id}`)}
              aria-label={`Modifica ${c.it}`}
            >
              <span className="en">{c.en}</span>
              <span className="it">{c.it}</span>
              <span className="rung-mark" aria-label={`livello ${rungIndicator(c)}`}>
                {rungIndicator(c)}
                {c.collected && (
                  <span className="rung-collected" aria-label="raccolta">
                    {" "}✦
                  </span>
                )}
              </span>
              <span className="cat">{c.cat}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
