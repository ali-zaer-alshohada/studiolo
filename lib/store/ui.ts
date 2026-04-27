"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * UI / Tweaks state — never exported via JSON backup. Persisted as `studiolo.ui.v1`.
 *
 * Defaults match the prototype's TWEAK_DEFAULTS verbatim:
 *   voice: "manoscritto" · severita: "sobrio" · errata: "lezione"
 * (The README claims "tipografo" is the voice default — README is wrong.)
 *
 * Theme uses Italian-facing values (`giorno` / `notte` / `auto`) and is
 * translated to `data-theme="light"|"dark"` on apply.
 */

export type Theme = "giorno" | "notte" | "auto";
export type Voice = "tipografo" | "manoscritto";
export type Severita = "standard" | "sobrio";
export type ErrataMode = "lezione" | "cronaca";

export type UIState = {
  theme: Theme;
  voice: Voice;
  severita: Severita;
  errata: ErrataMode;
  tweaksOpen: boolean;
  /** Filter chip selection on Coda. Local but persisted so Esc-to-Coda restores it. */
  codaFilter: "tutte" | "sostantivo" | "verbo" | "pronome" | "deboli";
};

export type UIActions = {
  setTheme: (t: Theme) => void;
  setVoice: (v: Voice) => void;
  setSeverita: (s: Severita) => void;
  setErrata: (e: ErrataMode) => void;
  setCodaFilter: (f: UIState["codaFilter"]) => void;
  toggleTweaks: () => void;
  setTweaksOpen: (open: boolean) => void;
  resetUI: () => void;
};

const initialUIState: UIState = {
  theme: "giorno",
  voice: "manoscritto",
  severita: "sobrio",
  errata: "lezione",
  tweaksOpen: false,
  codaFilter: "tutte",
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...initialUIState,
      setTheme: (theme) => set({ theme }),
      setVoice: (voice) => set({ voice }),
      setSeverita: (severita) => set({ severita }),
      setErrata: (errata) => set({ errata }),
      setCodaFilter: (codaFilter) => set({ codaFilter }),
      toggleTweaks: () => set((s) => ({ tweaksOpen: !s.tweaksOpen })),
      setTweaksOpen: (tweaksOpen) => set({ tweaksOpen }),
      resetUI: () => set({ ...initialUIState }),
    }),
    {
      name: "studiolo.ui.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        voice: s.voice,
        severita: s.severita,
        errata: s.errata,
        codaFilter: s.codaFilter,
        // tweaksOpen is intentionally NOT persisted — fresh sessions start closed.
      }),
    },
  ),
);

/**
 * Resolve the user-facing theme to the actual `data-theme` value, accounting
 * for `auto` mode by reading `prefers-color-scheme`.
 *
 * Pure for the non-auto cases; `auto` requires a window — call only client-side.
 */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "giorno") return "light";
  if (theme === "notte") return "dark";
  if (typeof window === "undefined") return "light"; // SSR fallback
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
