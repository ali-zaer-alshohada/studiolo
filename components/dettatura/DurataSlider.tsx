"use client";

type Props = {
  value: number;
  onChange: (n: number) => void;
  /** Show a vertical readout next to the slider. */
  readout?: string;
};

const MIN = 1.5;
const MAX = 6;
const STEP = 0.5;

/**
 * Vertical duration slider — lives inside the .dett-stage box, top-right.
 * "DURATA" label is rotated 180° to read bottom-up; the readout shows the
 * current value in italic Iowan ("3.0s").
 *
 * Vertical sliders need writing-mode + appearance hacks to render on Chromium;
 * see `.dur-vert` in globals.css.
 */
export function DurataSlider({ value, onChange, readout }: Props) {
  return (
    <div className="dett-dur-rail">
      <span className="dur-lbl">durata</span>
      <input
        type="range"
        className="dur-vert"
        min={MIN}
        max={MAX}
        step={STEP}
        value={value}
        // @ts-expect-error — `orient` is a non-standard Firefox attr for vertical sliders
        orient="vertical"
        aria-label={`Durata flash: ${value.toFixed(1)} secondi`}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="dur-val" aria-hidden>{readout ?? `${value.toFixed(1)}s`}</span>
    </div>
  );
}
