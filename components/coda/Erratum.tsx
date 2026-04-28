"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { relativeTimeIt } from "@/lib/text/relativeTimeIt";
import { RomanNumeral } from "@/components/primitives/Roman";
import {
  initTypingState,
  applyKey,
  applyBackspace,
  isFinished,
  type TypingState,
} from "@/lib/srs/typing";

type ErratumProps = {
  index: number;
  wrong: string;
  correct: string;
  ctx?: string;
  when: number;
  isActive: boolean;
  onActivate: () => void;
  onResolved: () => void;
};

export function Erratum({
  index,
  wrong,
  correct,
  ctx,
  when,
  isActive,
  onActivate,
  onResolved,
}: ErratumProps) {
  const [state, setState] = useState<TypingState>(() => initTypingState(correct));
  const [matched, setMatched] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Reset typing state whenever the row deactivates or the correct text changes.
  useEffect(() => {
    if (!isActive) {
      setState(initTypingState(correct));
    }
  }, [isActive, correct]);

  // Detect a clean finish — every letter typed right, no wrongs left over.
  useEffect(() => {
    if (!isActive) return;
    if (isFinished(state) && state.wrongCount === 0) {
      setMatched(true);
    }
  }, [state, isActive]);

  // Fade out, then ask parent to remove us.
  useEffect(() => {
    if (matched) {
      const t = setTimeout(onResolved, 400);
      return () => clearTimeout(t);
    }
  }, [matched, onResolved]);

  // Global keydown listener, attached only while this row is the active one.
  // Escape is handled by the parent (it deactivates this row).
  useEffect(() => {
    if (!isActive || matched) return;
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
  }, [isActive, matched]);

  return (
    <div
      ref={rowRef}
      className={clsx("erratum", "erratum--interactive", {
        "is-active": isActive,
        "is-matched": matched,
      })}
      role="listitem"
      onClick={() => {
        if (!matched && !isActive) onActivate();
      }}
    >
      <div className="num">
        <RomanNumeral n={index} suffix="." />
      </div>
      <div className="pair">
        <div className="wrong">{wrong}</div>
        <div className="corr corr--typed" aria-label={`correggi: ${correct}`}>
          {isActive
            ? state.text.split("").map((ch, i) => {
                const cls = state.states[i] ?? "untouched";
                const active = i === state.index;
                return (
                  <span
                    key={i}
                    className={clsx("er-letter", {
                      "is-right": cls === "right",
                      "is-wrong": cls === "wrong",
                      "is-cursor": active,
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
