"use client";

import { useEffect, useRef } from "react";
import type { ImportPreview } from "@/lib/io/types";
import { useDeckStore } from "@/lib/store/deck";

type Props = {
  preview: ImportPreview;
  onClose: (action: "replace" | "merge" | "cancel") => void;
};

const MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

function formatExportedAt(iso: string | null): string {
  if (!iso) return "(file prototype, nessuna data)";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

export function ImportPreviewModal({ preview, onClose }: Props) {
  const importState = useDeckStore((s) => s.importState);
  const mergeState = useDeckStore((s) => s.mergeState);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose("cancel");
      }
    }
    // Capture phase so this runs before the global Esc-to-Coda.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  function handleReplace() {
    importState(preview.normalized);
    onClose("replace");
  }
  function handleMerge() {
    mergeState(preview.normalized);
    onClose("merge");
  }
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose("cancel");
  }

  return (
    <div
      className="modal-bg"
      data-open="true"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-preview-title"
        tabIndex={-1}
      >
        <h2 id="import-preview-title" className="modal-title">
          <em>Importa</em> · trovate
        </h2>
        <p className="modal-summary">
          <span className="v">{preview.cardCount}</span>{" "}
          {preview.cardCount === 1 ? "carta" : "carte"}, <span className="v">{preview.errorCount}</span>{" "}
          {preview.errorCount === 1 ? "errore" : "errori"}.
          <br />
          Ultima esportazione: <em>{formatExportedAt(preview.exportedAt)}</em>.
        </p>
        <p className="modal-question">Cosa fare?</p>
        <div className="modal-actions">
          <button type="button" className="avanti-btn" onClick={handleReplace}>
            Sostituisci
          </button>
          <button type="button" className="avanti-btn" onClick={handleMerge}>
            Aggiungi
          </button>
          <button type="button" className="avanti-btn ghost" onClick={() => onClose("cancel")}>
            Annulla
          </button>
        </div>
        <p className="modal-hint">
          <em>Sostituisci</em> azzera lo stato attuale e usa solo questo file.{" "}
          <em>Aggiungi</em> tiene tutto e mescola.
        </p>
      </div>
    </div>
  );
}
