import type { Card, ErrorEvent, Session } from "@/lib/srs/types";

/**
 * The persisted deck shape. Subset of DeckState — excludes the `seeded` flag,
 * which is derivable: `seeded = cards.length > 0`.
 */
export type DeckPayload = {
  cards: Card[];
  errors: ErrorEvent[];
  sessions: Session[];
  streakLastDay: string | null;
  streakCount: number;
  lastBackup: number | null;
};

/** Export file format. `version` lets us evolve the schema. */
export type ExportEnvelope = {
  version: 1;
  exportedAt: string; // ISO 8601
  deck: DeckPayload;
};

export type ImportPreview = {
  cardCount: number;
  errorCount: number;
  /** ISO date of the file's exportedAt, or null for v0/prototype-shape files. */
  exportedAt: string | null;
  /** Validated, normalized deck payload ready to write into the store. */
  normalized: DeckPayload;
};

export type ValidationOk = { ok: true; preview: ImportPreview };
export type ValidationErr = { ok: false; error: string };
export type ValidationResult = ValidationOk | ValidationErr;
