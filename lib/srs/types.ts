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
