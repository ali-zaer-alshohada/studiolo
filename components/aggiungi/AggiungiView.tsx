"use client";

import { useEffect, useRef, useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { detectCat } from "@/lib/text/detectCat";
import type { Category, Card } from "@/lib/srs/types";
import { ContentEditableZone, type ContentEditableHandle } from "./ContentEditableZone";
import { CategoryChips } from "./CategoryChips";

const DEFAULT_CAT: Category = "altro";
const FEEDBACK_FADE_MS = 1800;
const RECENT_LIMIT = 5;

/**
 * Aggiungi — page v.
 *
 * The design thesis is "a writing surface, no form chrome." Two contenteditable
 * zones look like ruled paper; categoria has chip overrides; "Iscrivere ↵" saves.
 *
 * Save flow:
 *   1. read en + it from refs
 *   2. resolve category: user-override > detectCat > "altro"
 *   3. addCard → deck store
 *   4. clear zones, increment session counter, show fade-in feedback
 *   5. refocus en zone for the next entry
 */
export function AggiungiView() {
  const hydrated = useHydrated();
  const addCard = useDeckStore((s) => s.addCard);
  const cards = useDeckStore((s) => s.cards);

  const enRef = useRef<ContentEditableHandle>(null);
  const itRef = useRef<ContentEditableHandle>(null);

  const [detected, setDetected] = useState<Category | null>(null);
  const [override, setOverride] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedThisSession, setSavedThisSession] = useState(0);
  const feedbackTimer = useRef<number | undefined>(undefined);

  const active: Category = override ?? detected ?? DEFAULT_CAT;

  // Focus the EN zone on first paint after hydration.
  useEffect(() => {
    if (hydrated) enRef.current?.focus();
  }, [hydrated]);

  function handleItInput(text: string) {
    setDetected(detectCat(text));
  }

  function handleSave() {
    const en = enRef.current?.read() ?? "";
    const it = itRef.current?.read() ?? "";
    if (!en || !it) {
      setFeedback("manca il testo");
      scheduleFeedbackFade();
      return;
    }
    addCard({ en, it, cat: active });

    // Clear zones, reset detect/override, refocus EN.
    enRef.current?.set("");
    itRef.current?.set("");
    setDetected(null);
    setOverride(null);
    setSavedThisSession((n) => n + 1);
    setFeedback("iscritta");
    scheduleFeedbackFade();
    enRef.current?.focus();
  }

  function scheduleFeedbackFade() {
    if (feedbackTimer.current !== undefined) {
      window.clearTimeout(feedbackTimer.current);
    }
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
    }, FEEDBACK_FADE_MS);
  }

  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== undefined) {
        window.clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  // Recent additions, newest first.
  const recent: Card[] = hydrated
    ? [...cards]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, RECENT_LIMIT)
    : [];

  return (
    <section>
      <div className="section-label">
        <span>Aggiungi</span>
        <span className="rule" aria-hidden />
        <span className="pageno">v</span>
      </div>

      <div className="aggiungi-page">
        <div className="aggiungi-block">
          <div className="aggiungi-prompt">inglese</div>
          <ContentEditableZone
            ref={enRef}
            ariaLabel="Inglese · scrivi la parola in inglese"
            placeholder="the word in english · or a sentence"
            onEnter={() => itRef.current?.focus()}
            onCmdEnter={handleSave}
          />
        </div>

        <div className="aggiungi-block">
          <div className="aggiungi-prompt">
            italiano{" "}
            <span className="hint">— con articolo se sostantivo, ausiliare se verbo</span>
          </div>
          <ContentEditableZone
            ref={itRef}
            ariaLabel="Italiano · scrivi la traduzione"
            placeholder="la traduzione"
            onInput={handleItInput}
            onEnter={handleSave}
            onCmdEnter={handleSave}
          />
        </div>

        <div className="aggiungi-block">
          <CategoryChips
            active={active}
            detected={detected}
            isOverride={override !== null && override !== detected}
            onChange={(cat) => setOverride(cat)}
          />
        </div>

        <div className="aggiungi-actions">
          <button type="button" className="avanti-btn" onClick={handleSave}>
            Iscrivere ↵
          </button>
          <a href="/aggiungi/verbo" className="avanti-btn ghost" style={{ textDecoration: "none", display: "inline-block" }}>
            verbo con coniugazione →
          </a>
          {savedThisSession > 0 && (
            <span className="aggiungi-feedback">
              {feedback === "iscritta"
                ? `iscritta · ${savedThisSession} ${savedThisSession === 1 ? "carta" : "carte"}`
                : feedback}
            </span>
          )}
          {savedThisSession === 0 && feedback && (
            <span className="aggiungi-feedback">{feedback}</span>
          )}
        </div>

        {hydrated && recent.length > 0 && (
          <div className="aggiungi-recent">
            <div className="ar-head">
              <em>Ultime iscritte</em>
              <span style={{ color: "var(--muted)" }}>· {recent.length}</span>
            </div>
            <div className="ar-list">
              {recent.map((c) => (
                <div className="ar-row" key={c.id}>
                  <span className="en">{c.en}</span>
                  <span className="it">{c.it}</span>
                  <span className="cat">{c.cat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
