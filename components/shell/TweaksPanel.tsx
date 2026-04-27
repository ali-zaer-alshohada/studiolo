"use client";

import { useUIStore, type Theme, type Voice, type Severita, type ErrataMode } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ChipRow, Chip } from "@/components/primitives";
import { BackupGroup } from "./BackupGroup";

const THEMES: ReadonlyArray<{ v: Theme; label: string }> = [
  { v: "giorno", label: "giorno" },
  { v: "notte", label: "notte" },
  { v: "auto", label: "auto" },
];

const VOICES: ReadonlyArray<{ v: Voice; label: string }> = [
  { v: "tipografo", label: "tipografo" },
  { v: "manoscritto", label: "manoscritto" },
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
  const theme = useUIStore((s) => s.theme);
  const voice = useUIStore((s) => s.voice);
  const severita = useUIStore((s) => s.severita);
  const errata = useUIStore((s) => s.errata);
  const setTheme = useUIStore((s) => s.setTheme);
  const setVoice = useUIStore((s) => s.setVoice);
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
          <div className="tweak-label">voce</div>
          <ChipRow>
            {VOICES.map((o) => (
              <Chip
                key={o.v}
                active={hydrated && voice === o.v}
                onClick={() => setVoice(o.v)}
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
