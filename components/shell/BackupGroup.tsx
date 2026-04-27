"use client";

import { useRef, useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { buildExportEnvelope, exportFilename, triggerDownload } from "@/lib/io/exportJson";
import { parseImport } from "@/lib/io/importJson";
import type { ImportPreview } from "@/lib/io/types";
import { ImportPreviewModal } from "./ImportPreviewModal";
import { useInstallPrompt } from "./InstallPrompt";

const FEEDBACK_FADE_MS = 1800;

/**
 * 5th group in the Aspetto panel: Esporta + Importa + (Installa app, when available).
 */
export function BackupGroup() {
  const hydrated = useHydrated();
  const cardCount = useDeckStore((s) => s.cards.length);
  const markBackedUp = useDeckStore((s) => s.markBackedUp);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const installHandler = useInstallPrompt();

  const [feedback, setFeedback] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  function flash(text: string, tone: "ok" | "error" = "ok") {
    setFeedback({ text, tone });
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_FADE_MS);
  }

  function handleExport() {
    const state = useDeckStore.getState();
    const env = buildExportEnvelope({
      cards: state.cards,
      errors: state.errors,
      sessions: state.sessions,
      streakLastDay: state.streakLastDay,
      streakCount: state.streakCount,
      lastBackup: state.lastBackup,
    });
    triggerDownload(env, exportFilename());
    markBackedUp();
    flash(`esportato · ${state.cards.length} ${state.cards.length === 1 ? "carta" : "carte"}`);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = parseImport(text);
    if (!result.ok) {
      flash(result.error, "error");
      return;
    }
    setPreview(result.preview);
  }

  return (
    <section className="tweak-group">
      <div className="tweak-label">backup</div>
      <div className="backup-actions">
        <button type="button" className="backup-btn" onClick={handleExport} disabled={!hydrated}>
          ↓ esporta
        </button>
        <button type="button" className="backup-btn" onClick={handleImportClick}>
          ↑ importa
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: "none" }}
          aria-hidden
        />
      </div>
      {feedback && (
        <p className={`backup-feedback ${feedback.tone}`}>{feedback.text}</p>
      )}
      {preview && (
        <ImportPreviewModal
          preview={preview}
          onClose={(action) => {
            if (action === "replace") flash(`importato · ${preview.cardCount} carte (sostituite)`);
            else if (action === "merge") flash(`importato · ${preview.cardCount} carte (aggiunte)`);
            setPreview(null);
          }}
        />
      )}
      {installHandler && (
        <button
          type="button"
          className="backup-btn install-btn"
          onClick={() => installHandler()}
          style={{ marginTop: 8, width: "100%" }}
        >
          ↗ installa app
        </button>
      )}
      <p className="backup-hint">
        carte attuali: <span className="v">{hydrated ? cardCount : "—"}</span>
      </p>
    </section>
  );
}
