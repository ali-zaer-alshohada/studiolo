"use client";

import type { Category } from "@/lib/srs/types";

const CATEGORIES: ReadonlyArray<{ v: Category; label: string }> = [
  { v: "sostantivo", label: "sostantivo" },
  { v: "verbo", label: "verbo" },
  { v: "pronome", label: "pronome" },
  { v: "preposizione", label: "preposizione" },
  { v: "aggettivo", label: "aggettivo" },
  { v: "altro", label: "altro" },
];

type Props = {
  /** Currently active category (auto-detected or user-overridden). Null = none. */
  active: Category | null;
  /** What detectCat returned. Shown as "rilevata: <cat>" hint. Null when no match. */
  detected: Category | null;
  /** Whether the user has manually overridden detection. */
  isOverride: boolean;
  /** Whether the user has typed anything yet — affects the hint copy. */
  hasInput?: boolean;
  /** Called when the user clicks a chip. */
  onChange: (cat: Category) => void;
};

/**
 * 6-chip category selector for Aggiungi.
 * Active chip is filled (inverted colors). The "rilevata" hint shows what
 * the heuristic detected — useful feedback while typing in the IT zone.
 */
export function CategoryChips({ active, detected, isOverride, hasInput = true, onChange }: Props) {
  let hintText: string | null;
  if (detected) {
    hintText = `rilevata: ${detected}${isOverride ? " · sostituita" : ""}`;
  } else if (!hasInput) {
    hintText = "rilevata · scrivi prima l'italiano";
  } else {
    hintText = "rilevata: —";
  }
  return (
    <>
      <div className="aggiungi-prompt">
        categoria{" "}
        <span className="hint">— {hintText}</span>
      </div>
      <div className="aggiungi-cats" role="radiogroup" aria-label="Categoria">
        {CATEGORIES.map((c) => (
          <button
            key={c.v}
            type="button"
            role="radio"
            aria-pressed={active === c.v}
            aria-checked={active === c.v}
            onClick={() => onChange(c.v)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </>
  );
}
