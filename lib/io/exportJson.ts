import type { DeckPayload, ExportEnvelope } from "./types";

/** Build the export envelope. Pure. */
export function buildExportEnvelope(
  deck: DeckPayload,
  now: Date = new Date(),
): ExportEnvelope {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    deck,
  };
}

/** `studiolo-YYYY-MM-DD.json` (local-time, zero-padded date). */
export function exportFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `studiolo-${y}-${m}-${d}.json`;
}

/**
 * Side-effecting download trigger. Intentionally separate from the pure
 * envelope builder so tests don't have to mock the DOM.
 */
export function triggerDownload(env: ExportEnvelope, filename: string): void {
  const blob = new Blob([JSON.stringify(env, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
