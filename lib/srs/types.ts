/**
 * Shared types for the SRS subsystem.
 * Card / ErrorEvent / Session shapes are persisted to localStorage as
 * `postilla.state.v1` — match the prototype exactly.
 */

export type Category =
  | "sostantivo"
  | "verbo"
  | "pronome"
  | "preposizione"
  | "aggettivo"
  | "altro";

export type Tense =
  | "infinito"
  | "presente"
  | "passato_prossimo"
  | "imperfetto"
  | "futuro_semplice"
  | "condizionale_presente"
  | "presente_progressivo";

export type Pronoun = "io" | "tu" | "lui" | "noi" | "voi" | "loro";

export type ConjugationTable = Partial<
  Record<Tense, Partial<Record<Pronoun, string>>>
>;

export type HistoryEntry = {
  when: number;
  ok: boolean;
  /** Present only on wrong attempts. */
  wrong?: string;
};

export type Card = {
  id: string;
  en: string;
  it: string;
  cat: Category;
  /** Optional context note attached to the card itself (not to be confused with ctx on ErrorEvent). */
  ctx?: string;
  /** SRS ladder rung — index into LADDER_HOURS or CHILD_LADDER_HOURS. */
  rung: number;
  /**
   * Stack counter at the current rung — signed. +N counts toward promotion;
   * −N counts toward demotion. Resets to 0 on every rung change. Per the
   * stacks model: thresholds are STACKS[rung] (promote) and −STACKS[rung]
   * (demote); see lib/srs/ladder.ts.
   */
  charge: number;
  /** Epoch ms when the card is next due. */
  due: number;
  /** Total times this card has been missed (lifetime, never reset). */
  wrongs: number;
  /** Total times reviewed (right + wrong). Prototype uses `reviewed`, not `rights`. */
  reviewed: number;
  history: HistoryEntry[];
  parentId: string | null;
  isChild: boolean;
  createdAt: number;
  /** Phase-2 conjugation tables. Optional and backwards-compatible — Phase-1 cards have no `conj`. */
  conj?: ConjugationTable;
  /** Phase-3 paragraph for the typing trainer (Dettatura Option B). Excluded from
   * Studiare's normal SRS queue; surfaces only in /dettatura's typing mode. */
  paragraph?: string;
  /**
   * Set when the user clicks the "aggiungi al diario" certificate at rung v.
   * Once set, the certificate prompt no longer reappears on future v-encounters.
   * `sentence` is the user-written sentence using the word (added later via /diario).
   */
  collected?: {
    when: number;
    sentence?: string;
  };
  /**
   * Lives left in the gioco (memory-match) pool. Set to 3 when the user gets
   * the card wrong in studiare; decremented by 1 on each successful gioco
   * match; the card leaves the gioco pool when it reaches 0. Each match also
   * grants +1 charge in studiare's CAMMINO via srsCorrect.
   *
   * Optional / undefined = treat as 0 (not in pool).
   */
  giocoLives?: number;
};

export type ErrorEvent = {
  cardId: string;
  when: number;
  wrong: string;
  correct: string;
  /** What kind of error: "genere", "ausiliare", "preposizione", "dettatura", etc. */
  ctx: string;
};

export type Session = {
  startedAt: number;
  total: number;
  done: number;
  correctCount: number;
};
