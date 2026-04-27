"use client";

import { create } from "zustand";

/**
 * Active quiz session — in-memory only, NOT persisted. Cleared on tab close
 * or Esc-to-abort. The deck store keeps a *summary* of finished sessions in
 * its `sessions[]` field; this store holds the live queue + cursor + counters.
 *
 * Stored as a flat object so the QuizCard can read `card`/`state`/`userInput`
 * with single subscriptions and avoid prop drilling.
 */

export type QuizState = "prompt" | "corretto" | "sbagliato";

export type ActiveSession = {
  /** Card ids in the order they'll appear. */
  queue: string[];
  /** 0-based cursor into queue. */
  idx: number;
  /** Current state of the card on screen. */
  state: QuizState;
  /** What the user has typed (or just submitted) for the current card. */
  userInput: string;
  /** The correct answer to display in `sbagliato` state. */
  correctOnFile: string;
  /** Number of correct gradings so far. */
  correctCount: number;
  startedAt: number;
};

export type SessionStoreState = {
  active: ActiveSession | null;
};

export type SessionActions = {
  /** Start a fresh session over the given (already-shuffled) card-id queue. */
  start: (queue: string[]) => void;
  /** Transition: prompt → corretto. */
  markCorrect: () => void;
  /** Transition: prompt → sbagliato; record the correct answer for display. */
  markWrong: (userInput: string, correct: string) => void;
  /** Move on to the next card; resets state to prompt. Returns true if advanced, false if at end. */
  advance: () => boolean;
  /** Update the user's typed input (called from the input on every keystroke). */
  setInput: (s: string) => void;
  /** Append a character at the end of the input (used by accent-key bar). */
  appendInput: (s: string) => void;
  /** Clear the active session entirely. */
  abort: () => void;
};

export const useSessionStore = create<SessionStoreState & SessionActions>()((set, get) => ({
  active: null,

  start: (queue) =>
    set({
      active: {
        queue,
        idx: 0,
        state: "prompt",
        userInput: "",
        correctOnFile: "",
        correctCount: 0,
        startedAt: Date.now(),
      },
    }),

  markCorrect: () =>
    set((s) => {
      if (!s.active) return s;
      return {
        active: {
          ...s.active,
          state: "corretto",
          correctCount: s.active.correctCount + 1,
        },
      };
    }),

  markWrong: (userInput, correct) =>
    set((s) => {
      if (!s.active) return s;
      return {
        active: {
          ...s.active,
          state: "sbagliato",
          userInput,
          correctOnFile: correct,
        },
      };
    }),

  advance: () => {
    const a = get().active;
    if (!a) return false;
    const nextIdx = a.idx + 1;
    if (nextIdx >= a.queue.length) {
      // Session finished — leave a sentinel state for the page to show "done".
      set({
        active: { ...a, idx: nextIdx, state: "prompt", userInput: "", correctOnFile: "" },
      });
      return false;
    }
    set({
      active: { ...a, idx: nextIdx, state: "prompt", userInput: "", correctOnFile: "" },
    });
    return true;
  },

  setInput: (s) =>
    set((state) => (state.active ? { active: { ...state.active, userInput: s } } : state)),

  appendInput: (ch) =>
    set((state) =>
      state.active ? { active: { ...state.active, userInput: state.active.userInput + ch } } : state,
    ),

  abort: () => set({ active: null }),
}));
