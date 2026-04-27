"use client";

import type { ReactNode } from "react";
import { DurataSlider } from "./DurataSlider";

export type DettaturaPhase = "ready" | "show" | "recall" | "feedback";

type Props = {
  phase: DettaturaPhase;
  /** What's printed in the readout area. ReactNode so we can render <em> emphasis. */
  readout: ReactNode;
  /** What's printed in the top-left counter (e.g. "2.4 sec" or "a memoria"). */
  counter: string;
  /** Slider value (seconds). */
  duration: number;
  onDurationChange: (n: number) => void;
};

/**
 * The heavy-ruled flash box. Phase governs visibility:
 *   ready   — italic muted instruction
 *   show    — sentence visible, counter ticking
 *   recall  — sentence hidden, "— scrivere a memoria —"
 *   feedback— target shown again next to the user's attempt
 */
export function FlashStage({
  phase,
  readout,
  counter,
  duration,
  onDurationChange,
}: Props) {
  return (
    <div className="dett-stage" data-phase={phase}>
      <div className="dett-readout" aria-live="polite">{readout}</div>
      <DurataSlider value={duration} onChange={onDurationChange} />
      <div className="dett-counter" aria-live="polite">{counter}</div>
    </div>
  );
}
