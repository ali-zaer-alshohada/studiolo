import { describe, test, expect } from "vitest";
import { buildExportEnvelope, exportFilename } from "@/lib/io/exportJson";
import type { DeckPayload } from "@/lib/io/types";

const SAMPLE_DECK: DeckPayload = {
  cards: [],
  errors: [],
  sessions: [],
  streakLastDay: null,
  streakCount: 0,
  lastBackup: null,
};

describe("buildExportEnvelope", () => {
  test("wraps the deck in a v1 envelope with ISO timestamp", () => {
    const env = buildExportEnvelope(SAMPLE_DECK, new Date("2026-04-27T18:32:11.000Z"));
    expect(env.version).toBe(1);
    expect(env.exportedAt).toBe("2026-04-27T18:32:11.000Z");
    expect(env.deck).toBe(SAMPLE_DECK);
  });
});

describe("exportFilename", () => {
  test("formats as studiolo-YYYY-MM-DD.json (zero-padded local date)", () => {
    const d = new Date(2026, 3, 5);
    expect(exportFilename(d)).toBe("studiolo-2026-04-05.json");
  });

  test("December → 12, single-digit day padded", () => {
    const d = new Date(2026, 11, 3);
    expect(exportFilename(d)).toBe("studiolo-2026-12-03.json");
  });
});
