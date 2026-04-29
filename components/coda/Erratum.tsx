"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { relativeTimeIt } from "@/lib/text/relativeTimeIt";
import {
  initTypingState,
  applyKey,
  applyBackspace,
  isFinished,
  type TypingState,
} from "@/lib/srs/typing";

type ErratumProps = {
  wrong: string;
  correct: string;
  ctx?: string;
  when: number;
  isActive: boolean;
  /** True for the row that's animating out (held briefly by ErratumSlot). */
  isLeaving: boolean;
  onActivate: () => void;
  onMatched: () => void;
  onResolved: () => void;
};

/**
 * One row of errata content (no Roman numeral — that lives on ErratumSlot
 * so it stays fixed in place across queue shifts). Owns the typing state
 * machine for the active row.
 */
export function Erratum({
  wrong,
  correct,
  ctx,
  when,
  isActive,
  isLeaving,
  onActivate,
  onMatched,
}: ErratumProps) {
  const [state, setState] = useState<TypingState>(() => initTypingState(correct));
  const [matched, setMatched] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) setState(initTypingState(correct));
  }, [isActive, correct]);

  // Detect a clean finish — every letter typed right, no wrongs left over.
  useEffect(() => {
    if (!isActive || isLeaving) return;
    if (isFinished(state) && state.wrongCount === 0) {
      setMatched(true);
      onMatched();
    }
  }, [state, isActive, isLeaving, onMatched]);

  // Global keydown listener — only while this row is the active typing one.
  useEffect(() => {
    if (!isActive || matched || isLeaving) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "Escape") return; // parent deactivates
      if (k === "Backspace") {
        e.preventDefault();
        setState((s) => applyBackspace(s));
        return;
      }
      if (k.length !== 1) return;
      e.preventDefault();
      setState((s) => applyKey(s, k, Date.now()));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, matched, isLeaving]);

  return (
    <div
      ref={rowRef}
      className={clsx("erratum", "erratum--interactive", {
        "is-active": isActive,
        "is-leaving": isLeaving,
      })}
      onClick={() => {
        if (!isLeaving && !isActive) onActivate();
      }}
    >
      <div className="pair">
        <div className="wrong">{wrong}</div>
        <div className="corr corr--typed" aria-label={`correggi: ${correct}`}>
          {isActive
            ? state.text.split("").map((ch, i) => {
                const cls = state.states[i] ?? "untouched";
                const cursor = i === state.index;
                return (
                  <span
                    key={i}
                    className={clsx("er-letter", {
                      "is-right": cls === "right",
                      "is-wrong": cls === "wrong",
                      "is-cursor": cursor,
                    })}
                  >
                    {ch}
                  </span>
                );
              })
            : correct}
        </div>
      </div>
      <div className="meta">
        <span className="when">{relativeTimeIt(when)}</span>
        {ctx && <span className="ctx">{ctx}</span>}
      </div>
    </div>
  );
}
