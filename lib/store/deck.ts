"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Card, ErrorEvent, Session } from "@/lib/srs/types";
import { makeAllSeedCards, SEED_COUNT } from "@/data/seeds";
import { makeAllSeedVerbs } from "@/data/seedVerbs";
import type { ConjugationTable } from "@/lib/srs/types";
import { srsCorrect, srsWrong } from "@/lib/srs/ladder";
import { shouldSpawnChild, makeChild } from "@/lib/srs/child";
import { bumpStreak } from "@/lib/date/streak";
import type { DeckPayload } from "@/lib/io/types";

/**
 * Domain state — the deck. Persisted as `postilla.state.v1` (matching the
 * prototype's localStorage key exactly, so existing prototype users carry over
 * once we add a one-time format migration).
 *
 * NOTE: SRS math (gradeCorrect / gradeWrong / spawnChild) is implemented in
 * `lib/srs/` in M5. For M3 we ship action stubs that throw — sites that need
 * grading don't exist yet (Studiare is M6).
 */

export type DeckState = {
  cards: Card[];
  errors: ErrorEvent[];
  sessions: Session[];
  streakLastDay: string | null;
  streakCount: number;
  lastBackup: number | null;
  /** Has the deck been seeded yet? Prevents re-seeding after the user clears all cards. */
  seeded: boolean;
};

export type DeckActions = {
  /** Populate empty deck with the 25 prototype seeds. No-op if already seeded or non-empty. */
  seedIfEmpty: () => void;
  /** Force-seed (used by the gear panel's "carica esempi" button). */
  loadSeeds: () => void;
  /** Add the Phase-2 seed verbs if no card has a conjugation table yet. */
  seedVerbsIfMissing: () => void;
  /** Add a new card from a draft. Returns the created card's id. */
  addCard: (draft: { en: string; it: string; cat: Card["cat"]; ctx?: string }) => string;
  /** Add a verb card with a conjugation table. Returns the created card's id. */
  addVerbCard: (draft: { en: string; it: string; conj: ConjugationTable }) => string;
  /** Edit en / it / cat of an existing card in place. SRS state untouched. */
  updateCard: (id: string, draft: { en: string; it: string; cat: Card["cat"] }) => void;
  /** Add a paragraph card for the typing trainer. Returns the created card's id. */
  addParagraphCard: (draft: { title: string; paragraph: string }) => string;
  /** Wipe everything. Used by the danger button and by tests. */
  resetAll: () => void;
  /** Stamp the last-backup timestamp (called by exportJson). */
  markBackedUp: () => void;
  // SRS actions — implemented in M5.
  gradeCorrect: (cardId: string) => void;
  gradeWrong: (cardId: string, wrongInput: string, correctText: string, ctx: string) => void;
  /** Update the diary sentence for a collected card. No-op if the card isn't collected yet. */
  setSentence: (cardId: string, sentence: string) => void;
  /** Replace the entire deck state with the given payload. Used by Importa → Sostituisci. */
  importState: (payload: DeckPayload) => void;
  /** Merge the payload into current state (dedupe cards by id, append+sort errors, MAX streak). */
  mergeState: (payload: DeckPayload) => void;
};

const initialDeckState: DeckState = {
  cards: [],
  errors: [],
  sessions: [],
  streakLastDay: null,
  streakCount: 0,
  lastBackup: null,
  seeded: false,
};

export const useDeckStore = create<DeckState & DeckActions>()(
  persist(
    (set, get) => ({
      ...initialDeckState,

      seedIfEmpty: () => {
        const s = get();
        if (s.seeded || s.cards.length > 0) return;
        const now = Date.now();
        set({
          cards: [...makeAllSeedCards(now), ...makeAllSeedVerbs(now)],
          seeded: true,
        });
      },

      loadSeeds: () => {
        const fresh = makeAllSeedCards(Date.now());
        set((s) => ({ cards: [...s.cards, ...fresh], seeded: true }));
      },

      seedVerbsIfMissing: () => {
        const s = get();
        const hasConjugation = s.cards.some((c) => c.conj !== undefined);
        if (hasConjugation) return;
        const verbs = makeAllSeedVerbs(Date.now());
        set({ cards: [...s.cards, ...verbs] });
      },

      addCard: (draft) => {
        const now = Date.now();
        const id = `card-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const card: Card = {
          id,
          en: draft.en,
          it: draft.it,
          cat: draft.cat,
          ctx: draft.ctx,
          rung: 0,
          charge: 0,
          due: now,
          wrongs: 0,
          reviewed: 0,
          history: [],
          parentId: null,
          isChild: false,
          createdAt: now,
        };
        set((s) => ({ cards: [...s.cards, card] }));
        return id;
      },

      addVerbCard: (draft) => {
        const now = Date.now();
        const id = `verb-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const card: Card = {
          id,
          en: draft.en,
          it: draft.it,
          cat: "verbo",
          rung: 0,
          charge: 0,
          due: now,
          wrongs: 0,
          reviewed: 0,
          history: [],
          parentId: null,
          isChild: false,
          createdAt: now,
          conj: draft.conj,
        };
        set((s) => ({ cards: [...s.cards, card] }));
        return id;
      },

      updateCard: (id, draft) => {
        set((s) => {
          const idx = s.cards.findIndex((c) => c.id === id);
          if (idx < 0) return s;
          const card = s.cards[idx];
          if (!card) return s;
          const cards = [...s.cards];
          cards[idx] = { ...card, en: draft.en, it: draft.it, cat: draft.cat };
          return { cards };
        });
      },

      addParagraphCard: (draft) => {
        const now = Date.now();
        const id = `para-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const card: Card = {
          id,
          en: draft.title,
          it: draft.paragraph.slice(0, 60), // first 60 chars as a preview label
          cat: "altro",
          rung: 0,
          charge: 0,
          due: now + 365 * 86_400_000, // far future — never enters SRS queue
          wrongs: 0,
          reviewed: 0,
          history: [],
          parentId: null,
          isChild: false,
          createdAt: now,
          paragraph: draft.paragraph,
        };
        set((s) => ({ cards: [...s.cards, card] }));
        return id;
      },

      resetAll: () => set({ ...initialDeckState }),

      markBackedUp: () => set({ lastBackup: Date.now() }),

      gradeCorrect: (cardId) => {
        const now = Date.now();
        set((s) => {
          const idx = s.cards.findIndex((c) => c.id === cardId);
          if (idx < 0) return s; // unknown card → no-op
          const card = s.cards[idx];
          if (!card) return s;
          const updated = srsCorrect(card, now);
          const cards = [...s.cards];
          cards[idx] = updated;
          const streak = bumpStreak(
            { streakLastDay: s.streakLastDay, streakCount: s.streakCount },
            now,
          );
          return { cards, ...streak };
        });
      },

      gradeWrong: (cardId, wrongInput, correctText, ctx) => {
        const now = Date.now();
        set((s) => {
          const idx = s.cards.findIndex((c) => c.id === cardId);
          if (idx < 0) return s; // unknown card → no-op
          const card = s.cards[idx];
          if (!card) return s;

          // 1. Update the card via the SRS wrong handler.
          const updated = srsWrong(card, wrongInput, now);
          const cards = [...s.cards];
          cards[idx] = updated;

          // 2. Maybe spawn a chained child (must check AFTER updating wrongs).
          if (shouldSpawnChild(updated, cards, ctx)) {
            cards.push(makeChild(updated, ctx, now));
          }

          // 3. Append the error event.
          const errorEvent: ErrorEvent = {
            cardId,
            when: now,
            wrong: wrongInput,
            correct: correctText,
            ctx,
          };

          // 4. Bump streak (engagement counts even on wrongs).
          const streak = bumpStreak(
            { streakLastDay: s.streakLastDay, streakCount: s.streakCount },
            now,
          );

          return { cards, errors: [...s.errors, errorEvent], ...streak };
        });
      },

      setSentence: (cardId, sentence) => {
        set((s) => {
          const idx = s.cards.findIndex((c) => c.id === cardId);
          if (idx < 0) return s;
          const card = s.cards[idx];
          if (!card || !card.collected) return s; // only collected cards get a sentence
          const cards = [...s.cards];
          cards[idx] = {
            ...card,
            collected: { ...card.collected, sentence },
          };
          return { cards };
        });
      },

      importState: (payload) =>
        set({
          cards: payload.cards,
          errors: payload.errors,
          sessions: payload.sessions,
          streakLastDay: payload.streakLastDay,
          streakCount: payload.streakCount,
          lastBackup: payload.lastBackup,
          seeded: payload.cards.length > 0,
        }),

      mergeState: (payload) =>
        set((s) => {
          const existingIds = new Set(s.cards.map((c) => c.id));
          const newCards = payload.cards.filter((c) => !existingIds.has(c.id));
          const mergedErrors = [...s.errors, ...payload.errors].sort(
            (a, b) => a.when - b.when,
          );
          return {
            cards: [...s.cards, ...newCards],
            errors: mergedErrors,
            sessions: [...s.sessions, ...payload.sessions],
            streakCount: Math.max(s.streakCount, payload.streakCount),
            lastBackup: Date.now(),
            seeded: true,
          };
        }),
    }),
    {
      name: "postilla.state.v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Only persist data fields, not actions.
      partialize: (s) => ({
        cards: s.cards,
        errors: s.errors,
        sessions: s.sessions,
        streakLastDay: s.streakLastDay,
        streakCount: s.streakCount,
        lastBackup: s.lastBackup,
        seeded: s.seeded,
      }),
      /**
       * v1 → v2: add `charge: 0` to every card. Existing rung values carry
       * over 1:1 (the new ladder has the same length, just different intervals).
       * `collected` is left undefined; the certificate at rung v will only
       * surface for cards the user encounters going forward.
       */
      migrate: (persistedState, version) => {
        if (version >= 2 || !persistedState || typeof persistedState !== "object") {
          return persistedState as DeckState;
        }
        const s = persistedState as Partial<DeckState> & {
          cards?: ReadonlyArray<Card & { charge?: number }>;
        };
        return {
          ...s,
          cards: (s.cards ?? []).map((c) => ({
            ...c,
            charge: typeof c.charge === "number" ? c.charge : 0,
          })),
        } as DeckState;
      },
      // skipHydration: false (default) — Zustand reads localStorage on client mount.
    },
  ),
);

// ─── Selectors ───────────────────────────────────────────────────────

export const selectCards = (s: DeckState): Card[] => s.cards;
export const selectErrors = (s: DeckState): ErrorEvent[] => s.errors;
export const selectStreak = (s: DeckState): number => s.streakCount;

/** The N most recent errors, newest first. Useful for the Coda errata hero. */
export function selectRecentErrors(n: number) {
  return (s: DeckState): ErrorEvent[] =>
    [...s.errors].sort((a, b) => b.when - a.when).slice(0, n);
}

/** Cards due now (epoch ms compared to Date.now()). M5 will move this to lib/srs/queue.ts. */
export function selectDueCount(s: DeckState): number {
  const now = Date.now();
  return s.cards.filter((c) => c.due <= now).length;
}

export const SEED_TOTAL = SEED_COUNT;

/** Paragraph cards — surfaces only in /dettatura's typing-trainer mode. */
export const selectParagraphCards = (s: DeckState): Card[] =>
  s.cards.filter((c) => c.paragraph !== undefined);
