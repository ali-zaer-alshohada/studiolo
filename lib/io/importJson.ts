import type { Card, ErrorEvent, Session } from "@/lib/srs/types";
import type {
  DeckPayload,
  ExportEnvelope,
  ValidationResult,
  ValidationErr,
} from "./types";

const REQUIRED_CARD_FIELDS = [
  "id", "en", "it", "cat", "rung", "due", "wrongs",
  "reviewed", "history", "parentId", "isChild", "createdAt",
] as const;

function err(message: string): ValidationErr {
  return { ok: false, error: message };
}

function validateCard(c: unknown): c is Card {
  if (typeof c !== "object" || c === null) return false;
  for (const field of REQUIRED_CARD_FIELDS) {
    if (!(field in c)) return false;
  }
  return true;
}

function normalizeDeck(raw: Partial<DeckPayload> & { cards: unknown }): DeckPayload | null {
  if (!Array.isArray(raw.cards)) return null;
  if (!raw.cards.every(validateCard)) return null;
  // Forward-compat: v1 export files predate the `charge` field. Default to 0
  // so the imported deck satisfies the v2 schema.
  const cards = (raw.cards as Card[]).map((c) => ({
    ...c,
    charge: typeof c.charge === "number" ? c.charge : 0,
  }));
  return {
    cards,
    errors: Array.isArray(raw.errors) ? (raw.errors as ErrorEvent[]) : [],
    sessions: Array.isArray(raw.sessions) ? (raw.sessions as Session[]) : [],
    streakLastDay: typeof raw.streakLastDay === "string" ? raw.streakLastDay : null,
    streakCount: typeof raw.streakCount === "number" ? raw.streakCount : 0,
    lastBackup: typeof raw.lastBackup === "number" ? raw.lastBackup : null,
  };
}

/**
 * Parse and validate the contents of an import file.
 *
 * Accepts:
 *   - v1 envelope: `{ version: 1, exportedAt, deck: {...} }` (what we write)
 *   - v0 / prototype: flat `{ cards, errors, ... }` (the original prototype's format)
 */
export function parseImport(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("File non riconosciuto · JSON non valido.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    return err("File non riconosciuto · oggetto JSON atteso.");
  }

  let deckRaw: unknown;
  let exportedAt: string | null;
  if ("deck" in parsed && typeof (parsed as { deck: unknown }).deck === "object") {
    const env = parsed as Partial<ExportEnvelope>;
    deckRaw = env.deck;
    exportedAt = typeof env.exportedAt === "string" ? env.exportedAt : null;
  } else {
    deckRaw = parsed;
    exportedAt = null;
  }

  if (typeof deckRaw !== "object" || deckRaw === null) {
    return err("File non riconosciuto · sezione `deck` mancante.");
  }
  if (!("cards" in deckRaw)) {
    return err("File non riconosciuto · campo `cards` mancante.");
  }

  const normalized = normalizeDeck(deckRaw as Partial<DeckPayload> & { cards: unknown });
  if (!normalized) {
    return err("File non riconosciuto · una o più carte non valide.");
  }

  return {
    ok: true,
    preview: {
      cardCount: normalized.cards.length,
      errorCount: normalized.errors.length,
      exportedAt,
      normalized,
    },
  };
}
