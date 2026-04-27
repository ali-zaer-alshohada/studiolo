"use client";

import { useEffect } from "react";
import { useUIStore, type Theme, type Carattere, type Severita, type ErrataMode } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ChipRow, Chip } from "@/components/primitives";
import { BackupGroup } from "./BackupGroup";

const THEMES: ReadonlyArray<{ v: Theme; label: string }> = [
  { v: "giorno", label: "giorno" },
  { v: "notte", label: "notte" },
  { v: "auto", label: "auto" },
];

const CARATTERI: ReadonlyArray<{ v: Carattere; label: string }> = [
  { v: "antica", label: "antica" },
  { v: "moderna", label: "moderna" },
];

const SEVERITAS: ReadonlyArray<{ v: Severita; label: string }> = [
  { v: "standard", label: "standard" },
  { v: "sobrio", label: "sobrio" },
];

const ERRATAS: ReadonlyArray<{ v: ErrataMode; label: string }> = [
  { v: "lezione", label: "lezione" },
  { v: "cronaca", label: "cronaca" },
];

/**
 * Bottom-right toggle button + popup panel exposing 3 axes: voice / severita / errata.
 * Each chip writes to UI store; ClientShell re-applies the data-* attrs on <html>.
 *
 * For M3 the visuals are utilitarian. Refine in M10.
 */
export function TweaksPanel() {
  const hydrated = useHydrated();
  const open = useUIStore((s) => s.tweaksOpen);
  const toggle = useUIStore((s) => s.toggleTweaks);
  const setTweaksOpen = useUIStore((s) => s.setTweaksOpen);

  // When the panel is open, Esc closes it instead of falling through to
  // the global Esc-to-Coda handler. Capture phase + stopPropagation ensures
  // we run before the window-level listener.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setTweaksOpen(false);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, setTweaksOpen]);
  const theme = useUIStore((s) => s.theme);
  const carattere = useUIStore((s) => s.carattere);
  const severita = useUIStore((s) => s.severita);
  const errata = useUIStore((s) => s.errata);
  const setTheme = useUIStore((s) => s.setTheme);
  const setCarattere = useUIStore((s) => s.setCarattere);
  const setSeverita = useUIStore((s) => s.setSeverita);
  const setErrata = useUIStore((s) => s.setErrata);

  return (
    <>
      <button
        type="button"
        className="tweaks-toggle"
        aria-expanded={open}
        aria-controls="tweaks-panel"
        onClick={toggle}
      >
        Aspetto
      </button>
      <aside
        id="tweaks-panel"
        className="tweaks-panel"
        data-open={open ? "true" : undefined}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="tweaks-close"
          onClick={() => setTweaksOpen(false)}
          aria-label="Chiudi pannello aspetto"
        >
          ×
        </button>
        <h3 className="tweaks-panel-title">Aspetto</h3>

        <section className="tweak-group">
          <div className="tweak-label">tema</div>
          <ChipRow>
            {THEMES.map((o) => (
              <Chip
                key={o.v}
                active={hydrated && theme === o.v}
                onClick={() => setTheme(o.v)}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </section>

        <section className="tweak-group">
          <div className="tweak-label">carattere</div>
          <ChipRow>
            {CARATTERI.map((o) => (
              <Chip
                key={o.v}
                active={hydrated && carattere === o.v}
                onClick={() => setCarattere(o.v)}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </section>

        <section className="tweak-group">
          <div className="tweak-label">severità</div>
          <ChipRow>
            {SEVERITAS.map((o) => (
              <Chip
                key={o.v}
                active={hydrated && severita === o.v}
                onClick={() => setSeverita(o.v)}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </section>

        <section className="tweak-group">
          <div className="tweak-label">errata</div>
          <ChipRow>
            {ERRATAS.map((o) => (
              <Chip
                key={o.v}
                active={hydrated && errata === o.v}
                onClick={() => setErrata(o.v)}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </section>

        <BackupGroup />
      </aside>
    </>
  );
}
