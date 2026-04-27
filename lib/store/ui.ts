"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * UI / Tweaks state — never exported via JSON backup. Persisted as `studiolo.ui.v1`
 * (key kept for migration; version bumped to 2).
 *
 * Defaults: theme=giorno · carattere=antica · severita=sobrio · errata=lezione.
 *
 * v1 → v2 migration drops the legacy `voice` field (which never had visible effect)
 * and seeds `carattere: 'antica'`. The carattere axis swaps `--serif` between two
 * complete font sets (antica = humanist Iowan/Palatino; moderna = Bodoni-style).
 */

export type Theme = "giorno" | "notte" | "auto";
export type Carattere = "antica" | "moderna";
export type Severita = "standard" | "sobrio";
export type ErrataMode = "lezione" | "cronaca";
export type DettaturaMode = "frase" | "dattilografia";

export type UIState = {
  theme: Theme;
  carattere: Carattere;
  severita: Severita;
  errata: ErrataMode;
  tweaksOpen: boolean;
  /** Filter chip selection on Coda. Local but persisted so Esc-to-Coda restores it. */
  codaFilter: "tutte" | "sostantivo" | "verbo" | "pronome" | "deboli";
  /** Dettatura sub-mode. `frase` = flash-then-write (Option A); `dattilografia` = typing trainer (Option B). */
  dettaturaMode: DettaturaMode;
};

export type UIActions = {
  setTheme: (t: Theme) => void;
  setCarattere: (c: Carattere) => void;
  setSeverita: (s: Severita) => void;
  setErrata: (e: ErrataMode) => void;
  setCodaFilter: (f: UIState["codaFilter"]) => void;
  setDettaturaMode: (m: DettaturaMode) => void;
  toggleTweaks: () => void;
  setTweaksOpen: (open: boolean) => void;
  resetUI: () => void;
};

const initialUIState: UIState = {
  theme: "giorno",
  carattere: "antica",
  severita: "sobrio",
  errata: "lezione",
  tweaksOpen: false,
  codaFilter: "tutte",
  dettaturaMode: "frase",
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...initialUIState,
      setTheme: (theme) => set({ theme }),
      setCarattere: (carattere) => set({ carattere }),
      setSeverita: (severita) => set({ severita }),
      setErrata: (errata) => set({ errata }),
      setCodaFilter: (codaFilter) => set({ codaFilter }),
      setDettaturaMode: (dettaturaMode) => set({ dettaturaMode }),
      toggleTweaks: () => set((s) => ({ tweaksOpen: !s.tweaksOpen })),
      setTweaksOpen: (tweaksOpen) => set({ tweaksOpen }),
      resetUI: () => set({ ...initialUIState }),
    }),
    {
      name: "studiolo.ui.v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion < 2 && typeof persisted === "object" && persisted !== null) {
          const p = persisted as Record<string, unknown>;
          delete p.voice;
          if (typeof p.carattere !== "string") p.carattere = "antica";
        }
        return persisted as UIState & UIActions;
      },
      partialize: (s) => ({
        theme: s.theme,
        carattere: s.carattere,
        severita: s.severita,
        errata: s.errata,
        codaFilter: s.codaFilter,
        dettaturaMode: s.dettaturaMode,
      }),
    },
  ),
);

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "giorno") return "light";
  if (theme === "notte") return "dark";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
