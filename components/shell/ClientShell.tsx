"use client";

import { useEffect } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useUIStore, resolveTheme } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";

/**
 * Mounted once inside <body>. Responsibilities:
 *   1. Seed the deck on first run (after hydration).
 *   2. Sync UI store values to <html data-*> attributes for CSS to react to.
 *   3. Watch prefers-color-scheme when theme === "auto".
 *
 * Renders no DOM of its own — just side-effects + children pass-through.
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const seedIfEmpty = useDeckStore((s) => s.seedIfEmpty);

  const theme = useUIStore((s) => s.theme);
  const voice = useUIStore((s) => s.voice);
  const severita = useUIStore((s) => s.severita);
  const errata = useUIStore((s) => s.errata);

  // 1. Seed once on first hydration.
  useEffect(() => {
    if (hydrated) seedIfEmpty();
  }, [hydrated, seedIfEmpty]);

  // 2. Sync data-* attrs whenever UI prefs change. (Initial values are set on
  //    server-side render via layout.tsx; this re-applies when the user toggles.)
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.theme = resolveTheme(theme);
    root.dataset.voice = voice;
    root.dataset.severita = severita;
    root.dataset.errata = errata;
  }, [hydrated, theme, voice, severita, errata]);

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

  return <>{children}</>;
}
