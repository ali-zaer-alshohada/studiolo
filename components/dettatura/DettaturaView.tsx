"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { useUIStore } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { pickDettaturaCard, gradeDettatura, type DettaturaResult } from "@/lib/srs/dettatura";
import type { Card } from "@/lib/srs/types";
import { ContentEditableZone, type ContentEditableHandle } from "@/components/aggiungi/ContentEditableZone";
import { FlashStage, type DettaturaPhase } from "./FlashStage";
import { DettaturaFeedback } from "./DettaturaFeedback";
import { TypingTrainer } from "./TypingTrainer";
import { ChipRow, Chip } from "@/components/primitives";

const TICK_MS = 80;

/**
 * Dettatura — page vii · a memoria.
 *
 * Phase machine:
 *   ready    — initial; "Iniziare la dettatura" button
 *   show     — sentence visible, counter ticking down from `duration`
 *   recall   — sentence hidden, write zone enabled
 *   feedback — comparison shown, "Avanti →" to start a new flash
 *
 * Visibility-aware: when the tab is hidden during `show`, the timer pauses
 * (the user can't be reading); on visibility return, it resumes. The
 * prototype doesn't do this — it's a strict improvement.
 */
export function DettaturaView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const cards = useDeckStore((s) => s.cards);
  const paragraphs = useMemo(() => cards.filter((c) => c.paragraph !== undefined), [cards]);
  const gradeCorrect = useDeckStore((s) => s.gradeCorrect);
  const gradeWrong = useDeckStore((s) => s.gradeWrong);
  const dettaturaMode = useUIStore((s) => s.dettaturaMode);
  const setDettaturaMode = useUIStore((s) => s.setDettaturaMode);
  const [paragraphIdx, setParagraphIdx] = useState(0);

  const [phase, setPhase] = useState<DettaturaPhase>("ready");
  const [duration, setDuration] = useState(3); // seconds
  const [card, setCard] = useState<Card | null>(null);
  const [counter, setCounter] = useState("— · — sec");
  const [result, setResult] = useState<DettaturaResult | null>(null);

  const inputRef = useRef<ContentEditableHandle>(null);
  // Timer state. We track elapsed (not absolute deadline) so we can pause / resume.
  const tickHandle = useRef<number | undefined>(undefined);
  const elapsedRef = useRef(0);
  const lastTickAtRef = useRef<number | undefined>(undefined);

  function clearTick() {
    if (tickHandle.current !== undefined) {
      window.clearInterval(tickHandle.current);
      tickHandle.current = undefined;
    }
    lastTickAtRef.current = undefined;
  }

  function startTick() {
    clearTick();
    lastTickAtRef.current = Date.now();
    tickHandle.current = window.setInterval(() => {
      const now = Date.now();
      const last = lastTickAtRef.current ?? now;
      elapsedRef.current += now - last;
      lastTickAtRef.current = now;
      const remainMs = Math.max(0, duration * 1000 - elapsedRef.current);
      setCounter(`${(remainMs / 1000).toFixed(1)} sec`);
      if (remainMs <= 0) {
        clearTick();
        setPhase("recall");
        setCounter("a memoria");
        // focus the rewrite zone — mounted next render
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }, TICK_MS);
  }

  // Pause/resume on tab visibility change while in `show` phase.
  useEffect(() => {
    function onVisChange() {
      if (phase !== "show") return;
      if (document.hidden) {
        clearTick();
      } else {
        startTick();
      }
    }
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, duration]);

  // Esc-to-Coda is handled globally in ClientShell via useEscToCoda.

  useEffect(() => {
    return () => clearTick();
  }, []);

  function handleStart() {
    if (cards.length === 0) return;
    const picked = pickDettaturaCard(cards);
    if (!picked) return;
    setCard(picked);
    setResult(null);
    setPhase("show");
    elapsedRef.current = 0;
    setCounter(`${duration.toFixed(1)} sec`);
    if (inputRef.current) inputRef.current.set("");
    startTick();
  }

  function handleSubmit() {
    if (phase !== "recall" || !card) return;
    const userText = inputRef.current?.read() ?? "";
    const r = gradeDettatura(card, userText);
    setResult(r);
    setPhase("feedback");
    if (r.ok) {
      gradeCorrect(card.id);
    } else {
      // Use ctx="dettatura" so chained children spawn under that bucket.
      gradeWrong(card.id, r.yours, r.target, "dettatura");
    }
  }

  function handleRestart() {
    setPhase("ready");
    setResult(null);
    setCard(null);
    setCounter("— · — sec");
    elapsedRef.current = 0;
    if (inputRef.current) inputRef.current.set("");
  }

  if (!hydrated) {
    return (
      <section aria-labelledby="dettatura-heading">
        <h1 id="dettatura-heading" className="visually-hidden">Dettatura · pagina vii · a memoria</h1>
        <div className="section-label" aria-hidden>
          <span>Dettatura</span>
          <span className="rule" aria-hidden />
          <span className="pageno">vii · a memoria</span>
        </div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section aria-labelledby="dettatura-heading">
        <h1 id="dettatura-heading" className="visually-hidden">Dettatura · pagina vii · a memoria</h1>
        <div className="section-label" aria-hidden>
          <span>Dettatura</span>
          <span className="rule" aria-hidden />
          <span className="pageno">vii · a memoria</span>
        </div>
        <p className="empty-line">
          <em>Aggiungi prima una carta in italiano</em> per cominciare la dettatura.
        </p>
      </section>
    );
  }

  // Readout content varies by phase.
  let readout: React.ReactNode;
  switch (phase) {
    case "ready":
      readout = (
        <>
          premi <em>iniziare</em> · una frase apparirà per {duration.toFixed(1)} secondi
        </>
      );
      break;
    case "show":
      readout = card?.it ?? "";
      break;
    case "recall":
      readout = "— scrivere a memoria —";
      break;
    case "feedback":
      readout = card?.it ?? "";
      break;
  }

  const currentParagraph = paragraphs[paragraphIdx % Math.max(paragraphs.length, 1)];

  return (
    <section className="dettatura-page" aria-labelledby="dettatura-heading">
      <h1 id="dettatura-heading" className="visually-hidden">Dettatura · pagina vii · a memoria</h1>
      <div className="section-label" aria-hidden>
        <span>Dettatura</span>
        <span className="rule" />
        <span className="pageno">vii · a memoria</span>
      </div>

      <div className="dett-mode-row">
        <span className="dett-mode-label">modalità</span>
        <ChipRow>
          <Chip
            active={dettaturaMode === "frase"}
            onClick={() => setDettaturaMode("frase")}
          >
            frase a memoria
          </Chip>
          <Chip
            active={dettaturaMode === "dattilografia"}
            onClick={() => setDettaturaMode("dattilografia")}
          >
            dattilografia
          </Chip>
        </ChipRow>
      </div>

      {dettaturaMode === "frase" ? (
        <>
          <FlashStage
            phase={phase}
            readout={readout}
            counter={counter}
            duration={duration}
            onDurationChange={setDuration}
          />

          <div className="dett-input-row">
            <ContentEditableZone
              ref={inputRef}
              ariaLabel="Scrivi la frase a memoria"
              placeholder="ricomporre la frase a memoria"
              className={
                phase === "recall" ? "ruled-zone dett-write" : "ruled-zone dett-write disabled"
              }
              onEnter={handleSubmit}
            />
          </div>

          {phase === "feedback" && result && <DettaturaFeedback result={result} />}

          <div className="dett-controls">
            {phase === "ready" && (
              <button type="button" className="avanti-btn" onClick={handleStart} autoFocus>
                Iniziare la dettatura
              </button>
            )}
            {phase === "show" && (
              <button type="button" className="avanti-btn ghost" disabled>
                in lettura…
              </button>
            )}
            {phase === "recall" && (
              <button type="button" className="avanti-btn" onClick={handleSubmit}>
                Verificare ↵
              </button>
            )}
            {phase === "feedback" && (
              <button type="button" className="avanti-btn" onClick={handleRestart} autoFocus>
                Avanti →
              </button>
            )}
          </div>
        </>
      ) : (
        // Dattilografia (typing trainer)
        paragraphs.length === 0 ? (
          <p className="empty-line">
            <em>Nessun paragrafo ancora.</em>{" "}
            <a href="/aggiungi/paragrafo" style={{ color: "var(--accent)" }}>Aggiungerne uno</a> per cominciare la lezione di dattilografia.
          </p>
        ) : currentParagraph ? (
          <>
            <div className="dett-paragraph-meta">
              <span>{currentParagraph.en}</span>
              <span style={{ color: "var(--muted)" }}>
                · paragrafo {(paragraphIdx % paragraphs.length) + 1} di {paragraphs.length}
              </span>
            </div>
            <TypingTrainer
              key={currentParagraph.id}
              text={currentParagraph.paragraph!}
              onPickAnother={() => setParagraphIdx((i) => i + 1)}
            />
          </>
        ) : null
      )}
    </section>
  );
}
