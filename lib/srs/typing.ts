/**
 * Per-character state machine for the typing trainer (Dettatura · Option B).
 * Pure functions — UI mounts a global keydown listener and pumps keys here.
 *
 * State transitions on a key:
 *   - If at end of text → no-op (return same state ref).
 *   - First key stamps `startedAt` (used for live WPM).
 *   - `key === expected[index]` → mark `right`, increment correctCount.
 *   - else → mark `wrong`, increment wrongCount.
 *   - Either way: advance `index` (default behavior; strictMode would block).
 *
 * Backspace rewinds: decrement index, restore previous letter to `untouched`,
 * decrement the matching counter. No-op at index 0.
 */

export type LetterState = "untouched" | "right" | "wrong";

export type TypingState = {
  text: string;
  index: number;
  states: LetterState[];
  /** Epoch ms of the first keystroke (any key, right or wrong). Null until then. */
  startedAt: number | null;
  correctCount: number;
  wrongCount: number;
};

export function initTypingState(text: string): TypingState {
  return {
    text,
    index: 0,
    states: Array.from({ length: text.length }, () => "untouched"),
    startedAt: null,
    correctCount: 0,
    wrongCount: 0,
  };
}

export function applyKey(state: TypingState, key: string, now: number): TypingState {
  if (state.index >= state.text.length) return state;
  const expected = state.text[state.index];
  const correct = key === expected;
  const states = [...state.states];
  states[state.index] = correct ? "right" : "wrong";
  return {
    ...state,
    states,
    index: state.index + 1,
    startedAt: state.startedAt ?? now,
    correctCount: state.correctCount + (correct ? 1 : 0),
    wrongCount: state.wrongCount + (correct ? 0 : 1),
  };
}

export function applyBackspace(state: TypingState): TypingState {
  if (state.index === 0) return state;
  const prevIdx = state.index - 1;
  const wasState = state.states[prevIdx];
  const states = [...state.states];
  states[prevIdx] = "untouched";
  return {
    ...state,
    states,
    index: prevIdx,
    correctCount: state.correctCount - (wasState === "right" ? 1 : 0),
    wrongCount: state.wrongCount - (wasState === "wrong" ? 1 : 0),
  };
}

/** Words = correctCount / 5 (industry-standard). Minutes since startedAt. */
export function computeWPM(state: TypingState, now: number): number {
  if (state.startedAt === null) return 0;
  const elapsedMin = (now - state.startedAt) / 60_000;
  if (elapsedMin <= 0) return 0;
  const words = state.correctCount / 5;
  return Math.round(words / elapsedMin);
}

export function computeAccuracy(state: TypingState): number {
  const total = state.correctCount + state.wrongCount;
  if (total === 0) return 100;
  return Math.round((state.correctCount / total) * 100);
}

export function isFinished(state: TypingState): boolean {
  return state.index >= state.text.length;
}
