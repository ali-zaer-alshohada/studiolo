"use client";

import { useEffect } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useUIStore, resolveTheme } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useAmbientWarmth } from "@/lib/hooks/useAmbientWarmth";
import { useEscToCoda } from "@/lib/hooks/useEscToCoda";

/**
 * Mounted once inside <body>. Responsibilities:
 *   1. Seed the deck on first run (after hydration).
 *   2. Sync UI store values to <html data-*> attributes for CSS to react to.
 *   3. Watch prefers-color-scheme when theme === "auto".
 *   4. Run useAmbientWarmth (hour-of-day → --warm).
 *   5. Run useEscToCoda (global Esc handler).
 *
 * Renders no DOM of its own — just side-effects + children pass-through.
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const seedIfEmpty = useDeckStore((s) => s.seedIfEmpty);
  const seedVerbsIfMissing = useDeckStore((s) => s.seedVerbsIfMissing);

  const theme = useUIStore((s) => s.theme);
  const carattere = useUIStore((s) => s.carattere);
  const severita = useUIStore((s) => s.severita);
  const errata = useUIStore((s) => s.errata);

  useAmbientWarmth();
  useEscToCoda();

  // 1. Seed once on first hydration. Also backfill the Phase-2 verb cards
  //    for existing users who hydrated before verb seeds existed.
  useEffect(() => {
    if (!hydrated) return;
    seedIfEmpty();
    seedVerbsIfMissing();
  }, [hydrated, seedIfEmpty, seedVerbsIfMissing]);

  // 2. Sync data-* attrs whenever UI prefs change.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.theme = resolveTheme(theme);
    root.dataset.carattere = carattere;
    root.dataset.severita = severita;
    root.dataset.errata = errata;
  }, [hydrated, theme, carattere, severita, errata]);

  // 3. Auto-mode: re-resolve when the OS preference changes.
  useEffect(() => {
    if (!hydrated || theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [hydrated, theme]);

  // 4. Register service worker (production only — dev bundle staleness is a trap).
  useEffect(() => {
    if (!hydrated) return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("[sw] registration failed", err));
  }, [hydrated]);

  return <>{children}</>;
}
