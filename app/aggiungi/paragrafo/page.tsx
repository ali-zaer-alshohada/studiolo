"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { useUIStore } from "@/lib/store/ui";

/**
 * Aggiungi · paragrafo — page viii.
 * Add a paragraph for the typing trainer. Stored as a Card with `paragraph` set;
 * Studiare's SRS queue filters these out — they only surface in /dettatura's
 * `dattilografia` mode.
 */
export default function AggiungiParagrafoPage() {
  const router = useRouter();
  const addParagraphCard = useDeckStore((s) => s.addParagraphCard);
  const setDettaturaMode = useUIStore((s) => s.setDettaturaMode);
  const [title, setTitle] = useState("");
  const [paragraph, setParagraph] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const wordCount = paragraph.trim() ? paragraph.trim().split(/\s+/).length : 0;
  const charCount = paragraph.length;

  function handleSave() {
    if (!paragraph.trim()) return;
    // Auto-generate a title from the paragraph's first words if the user
    // didn't bother filling it in.
    const finalTitle =
      title.trim() || paragraph.trim().split(/\s+/).slice(0, 5).join(" ") + "…";
    addParagraphCard({ title: finalTitle, paragraph: paragraph.trim() });
    setDettaturaMode("dattilografia");
    setFeedback(`iscritto · ${wordCount} parole`);
    window.setTimeout(() => router.push("/dettatura"), 700);
  }

  return (
    <section aria-labelledby="paragrafo-heading">
      <h1 id="paragrafo-heading" className="visually-hidden">Aggiungi paragrafo · pagina viii · dattilografia</h1>
      <div className="section-label" aria-hidden>
        <span>Aggiungi · paragrafo</span>
        <span className="rule" />
        <span className="pageno">viii · dattilografia</span>
      </div>

      <p className="empty-line" style={{ marginTop: 12, marginBottom: 32 }}>
        <em>Un brano breve da digitare</em>, da 15 parole in su · sarà disponibile nella modalità <em>dattilografia</em> di Dettatura.
      </p>

      <div className="paragrafo-page">
        <div className="aggiungi-block">
          <div className="aggiungi-prompt">titolo</div>
          <input
            type="text"
            className="paragrafo-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. il mare di Calvino"
            spellCheck={false}
          />
        </div>

        <div className="aggiungi-block">
          <div className="aggiungi-prompt">
            testo{" "}
            <span className="hint">
              — {wordCount} {wordCount === 1 ? "parola" : "parole"} · {charCount} caratteri
            </span>
          </div>
          <textarea
            className="paragrafo-textarea"
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            placeholder="incolla o scrivi qui un paragrafo italiano da almeno 15 parole…"
            spellCheck={false}
            rows={8}
          />
        </div>

        <div className="aggiungi-actions">
          <button
            type="button"
            className="avanti-btn"
            onClick={handleSave}
            disabled={!paragraph.trim()}
          >
            Iscrivere ↵
          </button>
          <a href="/aggiungi" className="avanti-btn ghost" style={{ textDecoration: "none", display: "inline-block" }}>
            ← Aggiungi
          </a>
          {feedback && <span className="aggiungi-feedback">{feedback}</span>}
          {!feedback && !paragraph.trim() && (
            <span className="aggiungi-feedback" style={{ color: "var(--muted)" }}>
              · scrivi un testo per abilitare
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
