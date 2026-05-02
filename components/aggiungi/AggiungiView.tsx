"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { detectCat } from "@/lib/text/detectCat";
import { suggestArticle } from "@/lib/italian/articles";
import { inferAuxiliary } from "@/lib/italian/auxiliary";
import type { Category, Card } from "@/lib/srs/types";
import { ContentEditableZone, type ContentEditableHandle } from "./ContentEditableZone";
import { CategoryChips } from "./CategoryChips";

/** Strip a leading Italian article from a string so we can suggest a fresh one. */
const ARTICLE_PREFIX_RE = /^(il|lo|la|l['’]|i|gli|le|un|uno|una|un['’])\s+/i;

const DEFAULT_CAT: Category = "altro";
const FEEDBACK_FADE_MS = 1800;
const RECENT_LIMIT = 5;
const ROMAN_RUNGS = ["i", "ii", "iii", "iv", "v"] as const;

/** Tiny rung indicator for the recent list. Paragraphs aren't on the SRS ladder. */
function rungIndicator(card: Card): string {
  if (card.paragraph !== undefined) return "—";
  return ROMAN_RUNGS[card.rung] ?? `${card.rung + 1}`;
}

/**
 * Parse a single bulk-import line into a draft. Accepts these delimiters
 * (split on the first match): tab, em-dash, en-dash, " - ", " | ", " = ".
 * Returns null for blank lines or unparseable ones.
 */
const BULK_DELIMITERS_RE = /\t| — | – | - | \| | = /;
type BulkDraft = { en: string; it: string; cat: Category };
type BulkParsed = { ok: true; draft: BulkDraft } | { ok: false; line: string };
function parseBulkLine(line: string): BulkParsed | null {
  const trimmed = line.trim();
  if (trimmed === "") return null;
  const match = trimmed.match(BULK_DELIMITERS_RE);
  if (!match || match.index === undefined) {
    return { ok: false, line: trimmed };
  }
  const en = trimmed.slice(0, match.index).trim();
  const it = trimmed.slice(match.index + match[0].length).trim();
  if (en === "" || it === "") return { ok: false, line: trimmed };
  return { ok: true, draft: { en, it, cat: detectCat(it) ?? DEFAULT_CAT } };
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const addCard = useDeckStore((s) => s.addCard);
  const updateCard = useDeckStore((s) => s.updateCard);
  const cards = useDeckStore((s) => s.cards);

  const enRef = useRef<ContentEditableHandle>(null);
  const itRef = useRef<ContentEditableHandle>(null);

  const [detected, setDetected] = useState<Category | null>(null);
  const [override, setOverride] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedThisSession, setSavedThisSession] = useState(0);
  const [hasItInput, setHasItInput] = useState(false);
  const [itText, setItText] = useState("");
  /** When set, the form is editing this existing card instead of creating new. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const feedbackTimer = useRef<number | undefined>(undefined);

  const active: Category = override ?? detected ?? DEFAULT_CAT;
  const isEditing = editingId !== null;

  // Article suggestion — only for nouns, only when there's text. Strips any
  // article the user already typed so the hint reflects the actual head noun.
  const articleHint = useMemo(() => {
    if (active !== "sostantivo") return null;
    const stripped = itText.replace(ARTICLE_PREFIX_RE, "").trim();
    if (stripped === "") return null;
    const head = stripped.split(/\s+/)[0] ?? "";
    return suggestArticle(head);
  }, [itText, active]);

  // Auxiliary suggestion — only for verbs, mirrors the article hint.
  const auxHint = useMemo(() => {
    if (active !== "verbo") return null;
    const text = itText.trim();
    if (text === "") return null;
    return inferAuxiliary(text);
  }, [itText, active]);

  // Duplicate detection — soft warning if `it` already exists in the deck
  // (case-insensitive trim only). Doesn't block the save. When editing,
  // exclude the card under edit so we don't warn the user about themselves.
  const dupCard = useMemo(() => {
    const norm = itText.trim().toLowerCase();
    if (norm === "") return null;
    return (
      cards.find(
        (c) => c.id !== editingId && c.it.trim().toLowerCase() === norm,
      ) ?? null
    );
  }, [itText, cards, editingId]);

  // Focus the EN zone on first paint after hydration.
  useEffect(() => {
    if (hydrated) enRef.current?.focus();
  }, [hydrated]);

  // Pick up `?edit=<id>` from /carte (or any deep link). When present and
  // the card exists, kick off edit mode and strip the param from the URL
  // so a subsequent navigation back doesn't re-trigger.
  useEffect(() => {
    if (!hydrated) return;
    const editId = searchParams.get("edit");
    if (!editId) return;
    if (editingId === editId) return; // already editing this one
    const card = cards.find((c) => c.id === editId);
    if (!card) return;
    startEditing(card);
    router.replace("/aggiungi");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, searchParams]);

  function handleItInput(text: string) {
    setDetected(detectCat(text));
    setHasItInput(text.trim() !== "");
    setItText(text);
  }

  function handleSave() {
    const en = enRef.current?.read() ?? "";
    const it = itRef.current?.read() ?? "";
    if (!en || !it) {
      setFeedback("manca il testo");
      scheduleFeedbackFade();
      return;
    }
    if (isEditing && editingId) {
      updateCard(editingId, { en, it, cat: active });
      setFeedback("aggiornata");
    } else {
      addCard({ en, it, cat: active });
      setSavedThisSession((n) => n + 1);
      setFeedback("iscritta");
    }

    // Clear zones, reset state.
    enRef.current?.set("");
    itRef.current?.set("");
    setDetected(null);
    setOverride(null);
    setHasItInput(false);
    setItText("");
    setEditingId(null);
    scheduleFeedbackFade();
    enRef.current?.focus();
  }

  function startEditing(card: Card) {
    setEditingId(card.id);
    enRef.current?.set(card.en);
    itRef.current?.set(card.it);
    setItText(card.it);
    setHasItInput(card.it.trim() !== "");
    setDetected(detectCat(card.it));
    setOverride(card.cat); // anchor the chip on the existing category
    enRef.current?.focus();
    // Scroll the form into view so the edit is visible above the recent list.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    enRef.current?.set("");
    itRef.current?.set("");
    setItText("");
    setHasItInput(false);
    setDetected(null);
    setOverride(null);
    setFeedback(null);
  }

  // Bulk-import parse — pure derive from textarea content.
  const bulkParsed = useMemo(() => {
    return bulkText.split("\n").map(parseBulkLine).filter((p): p is BulkParsed => p !== null);
  }, [bulkText]);
  const bulkOk = bulkParsed.filter((p) => p.ok);
  const bulkErr = bulkParsed.filter((p) => !p.ok);

  function handleBulkImport() {
    if (bulkOk.length === 0) return;
    bulkOk.forEach((p) => {
      if (p.ok) addCard(p.draft);
    });
    setSavedThisSession((n) => n + bulkOk.length);
    setBulkText("");
    setBulkOpen(false);
    setFeedback("iscritta");
    scheduleFeedbackFade();
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
    <section aria-labelledby="aggiungi-heading">
      <h1 id="aggiungi-heading" className="visually-hidden">Aggiungi · pagina v</h1>
      <div className="section-label" aria-hidden>
        <span>Aggiungi</span>
        <span className="rule" />
        <span className="pageno">v</span>
      </div>

      <div className="aggiungi-page">
        {/* Type chooser — picks the *kind* of card. carta is this page;
            verbo and paragrafo navigate to their dedicated sub-routes. */}
        <nav className="aggiungi-types" aria-label="Tipo di carta">
          <span className="at-label">tipo</span>
          <span className="at-chip is-active" aria-current="page">carta</span>
          <a href="/aggiungi/verbo" className="at-chip">verbo</a>
          <a href="/aggiungi/paragrafo" className="at-chip">paragrafo</a>
        </nav>

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
          {articleHint && (
            <p className="article-hint" aria-live="polite">
              suggerimento ·{" "}
              <em className="ah-art">{articleHint.definite}</em>
              {" · "}
              <span className="ah-gender">
                {articleHint.gender === "m" ? "maschile" : "femminile"}
              </span>
              {articleHint.confidence === "low" && (
                <span className="ah-uncertain"> ?</span>
              )}
            </p>
          )}
          {auxHint && (
            <p className="article-hint" aria-live="polite">
              suggerimento · ausiliare ·{" "}
              <em className="ah-art">{auxHint}</em>
            </p>
          )}
          {dupCard && (
            <p className="dup-hint" aria-live="polite">
              esiste già · <em>{dupCard.en}</em>
            </p>
          )}
        </div>

        <div className="aggiungi-block">
          <CategoryChips
            active={active}
            detected={detected}
            isOverride={override !== null && override !== detected}
            hasInput={hasItInput}
            onChange={(cat) => setOverride(cat)}
          />
        </div>

        <div className="aggiungi-actions">
          <button type="button" className="avanti-btn" onClick={handleSave}>
            {isEditing ? "Aggiorna ↵" : "Aggiungi ↵"}
          </button>
          {isEditing && (
            <button type="button" className="link-btn" onClick={cancelEditing}>
              annulla
            </button>
          )}
          {savedThisSession > 0 && !isEditing && (
            <span className="aggiungi-feedback">
              {feedback === "iscritta"
                ? `iscritta · ${savedThisSession} ${savedThisSession === 1 ? "carta" : "carte"}`
                : feedback}
              {feedback === "iscritta" && (
                <>
                  {" · "}
                  <a href="/studiare" className="study-now-link">
                    studia →
                  </a>
                </>
              )}
            </span>
          )}
          {feedback === "aggiornata" && (
            <span className="aggiungi-feedback">aggiornata</span>
          )}
          {savedThisSession === 0 && feedback && feedback !== "aggiornata" && (
            <span className="aggiungi-feedback">{feedback}</span>
          )}
        </div>

        {/* Bulk import — paste multiple lines, parse en/it pairs, save as a batch.
            Accepts tab, em-dash, en-dash, " - ", " | ", " = " as the en→it
            separator on each line. */}
        <div className="aggiungi-bulk">
          {!bulkOpen ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => setBulkOpen(true)}
            >
              + importa molte
            </button>
          ) : (
            <div className="bulk-panel">
              <div className="bulk-head">
                <em>Importa molte</em>
                <span className="bulk-help">
                  {" "}una carta per riga · separatore: <code>—</code> oppure tab
                </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setBulkOpen(false);
                    setBulkText("");
                  }}
                  style={{ marginLeft: "auto" }}
                >
                  chiudi
                </button>
              </div>
              <textarea
                className="bulk-textarea"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"the table — il tavolo\nto study — studiare\n…"}
                rows={6}
                spellCheck={false}
              />
              {bulkText.trim() !== "" && (
                <div className="bulk-preview" aria-live="polite">
                  <p className="bulk-summary">
                    {bulkOk.length} {bulkOk.length === 1 ? "pronta" : "pronte"}
                    {bulkErr.length > 0 && (
                      <span className="bulk-err-count">
                        {" · "}
                        {bulkErr.length}{" "}
                        {bulkErr.length === 1 ? "non riconosciuta" : "non riconosciute"}
                      </span>
                    )}
                  </p>
                  {bulkErr.length > 0 && (
                    <ul className="bulk-errors">
                      {bulkErr.map((p, i) =>
                        !p.ok ? <li key={i}>{p.line}</li> : null,
                      )}
                    </ul>
                  )}
                </div>
              )}
              <div className="bulk-actions">
                <button
                  type="button"
                  className="avanti-btn"
                  onClick={handleBulkImport}
                  disabled={bulkOk.length === 0}
                >
                  Iscrivi {bulkOk.length > 0 ? bulkOk.length : ""} ↵
                </button>
              </div>
            </div>
          )}
        </div>

        {hydrated && recent.length > 0 && (
          <div className="aggiungi-recent">
            <div className="ar-head">
              <em>Ultime iscritte</em>
              <span style={{ color: "var(--muted)" }}>· {recent.length}</span>
              <a href="/carte" className="ar-see-all">vedi tutte →</a>
            </div>
            <div className="ar-list">
              {recent.map((c) => (
                <button
                  type="button"
                  className="ar-row"
                  key={c.id}
                  data-editing={editingId === c.id ? "1" : undefined}
                  onClick={() => startEditing(c)}
                  aria-label={`Modifica ${c.it}`}
                >
                  <span className="en">{c.en}</span>
                  <span className="it">{c.it}</span>
                  <span className="rung-mark" aria-label={`livello ${rungIndicator(c)}`}>
                    {rungIndicator(c)}
                    {c.collected && (
                      <span className="rung-collected" aria-label="raccolta">
                        {" "}✦
                      </span>
                    )}
                  </span>
                  <span className="cat">{c.cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
