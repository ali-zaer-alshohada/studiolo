"use client";

import { useEffect, useRef } from "react";
import type { Card } from "@/lib/srs/types";
import { useSessionStore } from "@/lib/store/session";
import { useDeckStore } from "@/lib/store/deck";
import { gradeAnswer, inferCtx } from "@/lib/srs/quiz";
import { AccentKeys } from "./AccentKeys";
import { Apparatus } from "./Apparatus";

type QuizCardProps = {
  card: Card;
  onFinishedAnswering: () => void;
};

/** Auto-advance delay after a `corretto` grade, in ms. */
const AUTO_ADVANCE_MS = 1400;

/**
 * The main quiz card — 2-column critical-edition layout.
 * Three states driven by `data-state`: prompt | corretto | sbagliato.
 * Same DOM, different subtree visibility — so the card "transforms" rather
 * than mounting/unmounting between states.
 */
export function QuizCard({ card, onFinishedAnswering }: QuizCardProps) {
  const state = useSessionStore((s) => s.active?.state ?? "prompt");
  const userInput = useSessionStore((s) => s.active?.userInput ?? "");
  const correctOnFile = useSessionStore((s) => s.active?.correctOnFile ?? "");
  const setInput = useSessionStore((s) => s.setInput);
  const appendInput = useSessionStore((s) => s.appendInput);
  const markCorrect = useSessionStore((s) => s.markCorrect);
  const markWrong = useSessionStore((s) => s.markWrong);
  const gradeCorrectStore = useDeckStore((s) => s.gradeCorrect);
  const gradeWrongStore = useDeckStore((s) => s.gradeWrong);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on every prompt-state mount.
  useEffect(() => {
    if (state === "prompt") inputRef.current?.focus();
  }, [state, card.id]);

  // Auto-advance after correct.
  useEffect(() => {
    if (state !== "corretto") return;
    const t = window.setTimeout(onFinishedAnswering, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [state, onFinishedAnswering]);

  function submit() {
    if (state !== "prompt") return;
    const result = gradeAnswer(card, userInput);
    if (result.ok) {
      gradeCorrectStore(card.id);
      markCorrect();
    } else {
      const ctx = inferCtx(result.userInput, result.correct);
      gradeWrongStore(card.id, result.userInput, result.correct, ctx);
      markWrong(result.userInput, result.correct);
    }
  }

  return (
    <article className="card" data-state={state} aria-live="polite">
      <div className="lex">
        <div className="meta-block">
          <span className="pos">{card.cat}</span>
          <span className="sep" aria-hidden />
          <span>carta · {card.isChild ? "postilla" : "principale"}</span>
        </div>

        {/* PROMPT */}
        {state === "prompt" && (
          <>
            <div className="quiz-prompt">Traduci · in italiano</div>
            <h2 className="quiz-question">{card.en}</h2>

            <AccentKeys
              onInsert={(ch) => {
                appendInput(ch);
                inputRef.current?.focus();
              }}
            />

            <div className="input-row">
              <input
                ref={inputRef}
                type="text"
                className="quiz-input"
                value={userInput}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="…"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                aria-label={`Traduci ${card.en} in italiano`}
              />
              <span className="submit-hint" aria-hidden>↵</span>
            </div>
          </>
        )}

        {/* CORRETTO */}
        {state === "corretto" && (
          <div className="corretto-state">
            <div className="quiz-prompt">{card.en}</div>
            <p className="answer-line">
              <span className="check" aria-label="Corretto">✓</span>
              <span>{userInput}</span>
            </p>
            <button
              type="button"
              className="avanti-btn"
              onClick={onFinishedAnswering}
              autoFocus
            >
              Avanti →
            </button>
          </div>
        )}

        {/* SBAGLIATO */}
        {state === "sbagliato" && (
          <div className="sbagliato-state">
            <div className="quiz-prompt">{card.en}</div>
            <p className="wrong-input">
              <span aria-label="Sbagliato">✗</span> {userInput || "(vuoto)"}
            </p>
            <p className="correction">
              <em>vedi:</em> {correctOnFile}
            </p>
            <button
              type="button"
              className="avanti-btn"
              onClick={onFinishedAnswering}
              autoFocus
            >
              Avanti →
            </button>
          </div>
        )}
      </div>

      <Apparatus card={card} />
    </article>
  );
}
