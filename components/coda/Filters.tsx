"use client";

import { useDeckStore } from "@/lib/store/deck";
import { useUIStore, type UIState } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ChipRow, Chip } from "@/components/primitives";
import type { Card } from "@/lib/srs/types";

type FilterValue = UIState["codaFilter"];

const OPTIONS: ReadonlyArray<{ v: FilterValue; label: string }> = [
  { v: "tutte", label: "Tutte" },
  { v: "sostantivo", label: "Sostantivi" },
  { v: "verbo", label: "Verbi" },
  { v: "pronome", label: "Pronomi" },
  { v: "deboli", label: "Deboli" },
];

function countFor(filter: FilterValue, cards: Card[]): number {
  if (filter === "tutte") return cards.length;
  if (filter === "deboli") return cards.filter((c) => c.wrongs >= 2).length;
  return cards.filter((c) => c.cat === filter).length;
}

/**
 * Five filter chips. "Deboli" (weak) means cards with ≥2 lifetime wrongs —
 * the cards the user keeps tripping on. The filter affects the ErrataHero
 * (which errors are shown) and is used by Aggiungi/Statistiche if relevant.
 */
export function Filters() {
  const hydrated = useHydrated();
  const cards = useDeckStore((s) => s.cards);
  const filter = useUIStore((s) => s.codaFilter);
  const setFilter = useUIStore((s) => s.setCodaFilter);

  return (
    <ChipRow className="filters">
      {OPTIONS.map((opt) => (
        <Chip
          key={opt.v}
          active={hydrated && filter === opt.v}
          onClick={() => setFilter(opt.v)}
          count={hydrated ? countFor(opt.v, cards) : undefined}
        >
          {opt.label}
        </Chip>
      ))}
    </ChipRow>
  );
}
