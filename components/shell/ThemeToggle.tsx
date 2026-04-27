"use client";

import { useUIStore, type Theme } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";

const OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: "giorno", label: "giorno" },
  { value: "notte", label: "notte" },
  { value: "auto", label: "auto" },
];

/**
 * Three-segment theme toggle: Giorno / Notte / Auto.
 * Lives in the header.actions area. Uses .icon-btn styling.
 */
export function ThemeToggle() {
  const hydrated = useHydrated();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Tema">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={hydrated && theme === opt.value}
          onClick={() => setTheme(opt.value)}
          className="icon-btn"
          data-active={hydrated && theme === opt.value ? "true" : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
