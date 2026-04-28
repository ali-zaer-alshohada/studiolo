"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Card } from "@/lib/srs/types";
import { useSessionStore } from "@/lib/store/session";
import { useDeckStore } from "@/lib/store/deck";
import { gradeAnswer, inferCtx } from "@/lib/srs/quiz";
import { pickConjugationPrompt, gradeConjugation } from "@/lib/srs/conjugation";
import { inferAuxiliary, userUsedWrongAuxiliary } from "@/lib/italian/auxiliary";
import { AccentKeys } from "./AccentKeys";
import { Apparatus } from "./Apparatus";

type QuizCardProps = {
  card: Card;
  onFinishedAnswering: () => void;
};

const AUTO_ADVANCE_MS = 1400;

/**
 * Quiz card — branches at the top by card type:
 *   - Verb card with `conj` table → conjugation drill (Phase 2).
 *     Prompt format: [infinitive] · tense · pronoun → ?
 *   - Any other card → translation drill. Prompt: [English] → ?
 *
 * Both branches share the same 3-state machine (prompt | corretto | sbagliato),
 * the same input + accent keys, the same Apparatus column, and the same
 * `gradeCorrect`/`gradeWrong` plumbing. Verb-quiz wrongs use ctx="coniugazione"
 * so chained children spawn under that bucket.
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

  // Pick a conjugation cell ONCE per card mount (key === card.id) so the
  // user sees the same prompt across prompt → corretto/sbagliato.
  const conjugationPrompt = useMemo(
    () => (card.conj ? pickConjugationPrompt(card) : null),
    [card.id, card.conj], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const isConjugation = conjugationPrompt !== null;

  useEffect(() => {
    if (state === "prompt") inputRef.current?.focus();
  }, [state, card.id]);

  useEffect(() => {
    if (state !== "corretto") return;
    const t = window.setTimeout(onFinishedAnswering, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [state, onFinishedAnswering]);

  function submit() {
    if (state !== "prompt") return;
    if (isConjugation && conjugationPrompt) {
      const r = gradeConjugation(conjugationPrompt, userInput);
      if (r.ok) {
        gradeCorrectStore(card.id);
        markCorrect();
      } else {
        gradeWrongStore(card.id, r.userInput, r.expected, "coniugazione");
        markWrong(r.userInput, r.expected);
      }
    } else {
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
  }

  return (
    <article className="card" data-state={state} aria-live="polite">
      <div className="lex">
        <div className="meta-block">
          <span className="pos">{card.cat}</span>
          <span className="sep" aria-hidden />
          <span>
            carta · {card.isChild ? "postilla" : isConjugation ? "coniugazione" : "principale"}
          </span>
        </div>

        {/* PROMPT */}
        {state === "prompt" && (
          <>
            {isConjugation && conjugationPrompt ? (
              <>
                <div className="quiz-prompt">
                  Coniuga · {conjugationPrompt.tenseLabel} · {conjugationPrompt.pronounLabel}
                </div>
                <h2 className="quiz-question">
                  <em>{card.it}</em>
                </h2>
              </>
            ) : (
              <>
                <div className="quiz-prompt">Traduci · in italiano</div>
                <h2 className="quiz-question">{card.en}</h2>
              </>
            )}

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
                aria-label={
                  isConjugation && conjugationPrompt
                    ? `Coniuga ${card.it} al ${conjugationPrompt.tenseLabel} per ${conjugationPrompt.pronounLabel}`
                    : `Traduci ${card.en} in italiano`
                }
              />
              <span className="submit-hint" aria-hidden>↵</span>
            </div>
          </>
        )}

        {/* CORRETTO */}
        {state === "corretto" && (
          <div className="corretto-state">
            <div className="quiz-prompt">
              {isConjugation && conjugationPrompt
                ? `${card.it} · ${conjugationPrompt.tenseLabel} · ${conjugationPrompt.pronounLabel}`
                : card.en}
            </div>
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
            <div className="quiz-prompt">
              {isConjugation && conjugationPrompt
                ? `${card.it} · ${conjugationPrompt.tenseLabel} · ${conjugationPrompt.pronounLabel}`
                : card.en}
            </div>
            <p className="wrong-input">
              <span aria-label="Sbagliato">✗</span> {userInput || "(vuoto)"}
            </p>
            <p className="correction">
              <em>vedi:</em> {correctOnFile}
            </p>
            {isConjugation &&
              conjugationPrompt?.tense === "passato_prossimo" &&
              (() => {
                const aux = inferAuxiliary(card.it);
                if (!userUsedWrongAuxiliary(userInput, aux)) return null;
                return (
                  <p className="aux-tip">
                    <em>ricorda:</em> <strong>{card.it}</strong> prende{" "}
                    <em className="aux-name">{aux}</em>
                    {" · "}
                    <span className="aux-form">{correctOnFile}</span>
                  </p>
                );
              })()}
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
