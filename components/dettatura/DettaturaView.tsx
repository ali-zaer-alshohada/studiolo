"use client";

import { useMemo, useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { TypingTrainer } from "./TypingTrainer";

/**
 * Dettatura — page vii · dattilografia.
 *
 * Typing-trainer mode: pick a paragraph card from the deck, type it through
 * with live WPM / accuracy / time. The "frase a memoria" flash-then-write
 * mode was removed (per the 2026-05-03 simplification — only dattilografia
 * remains under this section).
 *
 * Esc-to-Coda is handled globally in ClientShell via useEscToCoda.
 */
export function DettaturaView() {
  const hydrated = useHydrated();
  const cards = useDeckStore((s) => s.cards);
  const paragraphs = useMemo(
    () => cards.filter((c) => c.paragraph !== undefined),
    [cards],
  );

  // Shuffled paragraph order, regenerated whenever the deck's paragraph count
  // changes. We index INTO this shuffled order so each "Cambia testo"
  // advances pseudo-randomly.
  const shuffledOrder = useMemo(() => {
    const indices = paragraphs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i]!;
      indices[i] = indices[j]!;
      indices[j] = tmp;
    }
    return indices;
  }, [paragraphs.length]);
  const [paragraphIdx, setParagraphIdx] = useState(0);

  if (!hydrated) {
    return (
      <section aria-labelledby="dettatura-heading">
        <h1 id="dettatura-heading" className="visually-hidden">
          Dettatura · pagina vii · dattilografia
        </h1>
        <div className="section-label" aria-hidden>
          <span>Dettatura</span>
          <span className="rule" aria-hidden />
          <span className="pageno">vii · dattilografia</span>
        </div>
      </section>
    );
  }

  const currentParagraphIdx =
    shuffledOrder.length > 0
      ? shuffledOrder[paragraphIdx % shuffledOrder.length]
      : undefined;
  const currentParagraph =
    currentParagraphIdx !== undefined
      ? paragraphs[currentParagraphIdx]
      : undefined;

  return (
    <section className="dettatura-page" aria-labelledby="dettatura-heading">
      <h1 id="dettatura-heading" className="visually-hidden">
        Dettatura · pagina vii · dattilografia
      </h1>
      <div className="section-label" aria-hidden>
        <span>Dettatura</span>
        <span className="rule" />
        <span className="pageno">vii · dattilografia</span>
      </div>

      {paragraphs.length === 0 ? (
        <p className="empty-line">
          <em>Nessun paragrafo ancora.</em>{" "}
          <a href="/aggiungi/paragrafo" style={{ color: "var(--accent)" }}>
            Aggiungerne uno
          </a>{" "}
          per cominciare la lezione di dattilografia.
        </p>
      ) : currentParagraph ? (
        <>
          <div className="dett-paragraph-meta">
            <span>{currentParagraph.en}</span>
            <span style={{ color: "var(--muted)" }}>
              · paragrafo {(paragraphIdx % paragraphs.length) + 1} di{" "}
              {paragraphs.length}
            </span>
          </div>
          <TypingTrainer
            key={currentParagraph.id}
            text={currentParagraph.paragraph!}
            onPickAnother={() => setParagraphIdx((i) => i + 1)}
          />
        </>
      ) : null}
    </section>
  );
}
