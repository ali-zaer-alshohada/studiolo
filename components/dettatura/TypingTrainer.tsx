"use client";

import { useEffect, useMemo, useState } from "react";
import {
  initTypingState,
  applyKey,
  applyBackspace,
  computeWPM,
  computeAccuracy,
  isFinished,
  type TypingState,
} from "@/lib/srs/typing";

const KEYBOARD_ROWS: ReadonlyArray<string[]> = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

type Props = {
  /** The paragraph to type. */
  text: string;
  /** Callback when user clicks "Cambia" — switch to a different paragraph. */
  onPickAnother?: () => void;
};

export function TypingTrainer({ text, onPickAnother }: Props) {
  const [state, setState] = useState<TypingState>(() => initTypingState(text));
  const [now, setNow] = useState(() => Date.now());

  // Reset when text changes (different paragraph picked).
  useEffect(() => {
    setState(initTypingState(text));
  }, [text]);

  // Tick once per second to refresh live WPM/time displays. Sync immediately
  // when startedAt is stamped (avoids negative elapsed because `now` was set
  // on mount, before the first keystroke ever stamped startedAt).
  useEffect(() => {
    if (state.startedAt === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.startedAt]);

  // Global keydown listener — only active while this component is mounted.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore meta combos (Cmd+R, Ctrl+T, etc.) and modifier-only keys.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "Backspace") {
        e.preventDefault();
        setState((s) => applyBackspace(s));
        return;
      }
      // Ignore non-character keys.
      if (k.length !== 1) return;
      e.preventDefault();
      setState((s) => applyKey(s, k, Date.now()));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const wpm = computeWPM(state, now);
  const accuracy = computeAccuracy(state);
  const elapsedSec =
    state.startedAt === null ? 0 : Math.max(0, Math.floor((now - state.startedAt) / 1000));
  const progress = (state.index / state.text.length) * 100;
  const finished = isFinished(state);

  // Compute the next-expected key for the on-screen keyboard highlight.
  const nextChar = state.text[state.index]?.toLowerCase() ?? null;

  // Letters memo so React doesn't recreate the array on `now` ticks.
  const letters = useMemo(
    () =>
      state.text.split("").map((ch, i) => ({
        ch,
        cls: state.states[i] ?? "untouched",
        active: i === state.index,
      })),
    [state.text, state.states, state.index],
  );

  function reset() {
    setState(initTypingState(text));
    setNow(Date.now());
  }

  return (
    <div className="typing-trainer">
      <div className="typing-progress" aria-hidden>
        <div className="fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="typing-stats" role="status" aria-live="polite">
        <span>velocità · <em className="v">{wpm}</em> ppm</span>
        <span>precisione · <em className="v">{accuracy}</em>%</span>
        <span>tempo · <em className="v">{formatTime(elapsedSec)}</em></span>
      </div>

      <div className="lesson-text" aria-label="testo da digitare">
        {letters.map((l, i) => (
          <span
            key={i}
            className={`letter ${l.cls === "right" ? "is-right" : l.cls === "wrong" ? "is-wrong" : ""} ${l.active ? "is-active" : ""}`}
          >
            {l.ch === " " ? " " : l.ch}
          </span>
        ))}
      </div>

      <div className="onscreen-keyboard" aria-hidden>
        {KEYBOARD_ROWS.map((row, i) => (
          <div className={`kb-row kb-row-${i + 1}`} key={i}>
            {row.map((k) => (
              <span
                key={k}
                className={`key ${nextChar === k ? "is-next" : ""}`}
              >
                {k}
              </span>
            ))}
          </div>
        ))}
        <div className="kb-row kb-row-4">
          <span className={`key key-space ${nextChar === " " ? "is-next" : ""}`}>spazio</span>
        </div>
      </div>

      {finished && (
        <div className="typing-end" role="alert">
          <h2 className="typing-end-title">Lezione finita.</h2>
          <p className="typing-end-stats">
            <em className="v">{wpm}</em> parole al minuto · <em className="v">{accuracy}</em>% di precisione · <em className="v">{formatTime(elapsedSec)}</em>
          </p>
          <div className="typing-end-actions">
            <button type="button" className="avanti-btn" onClick={reset} autoFocus>
              Ricominciare ↺
            </button>
            {onPickAnother && (
              <button type="button" className="avanti-btn ghost" onClick={onPickAnother}>
                Cambia testo →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
