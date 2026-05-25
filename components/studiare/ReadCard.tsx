"use client";

import { useMemo, useState } from "react";
import type { Card } from "@/lib/srs/types";
import { useSessionStore } from "@/lib/store/session";
import { useDeckStore } from "@/lib/store/deck";
import { pickConjugationPrompt } from "@/lib/srs/conjugation";
import {
  reviewIntervalHours,
  formatIntervalIt,
  type ReviewGrade,
} from "@/lib/srs/review";
import { Apparatus } from "./Apparatus";

type ReadCardProps = {
  card: Card;
  onFinishedAnswering: () => void;
};

/**
 * The /studiare card — no typed exam. Read the prompt, reveal the answer, then
 * pick one of three colours that choose the next due date (see lib/srs/review.ts):
 *
 *   rosso  "ancora"  → soonest   (relearn; logged as a miss)
 *   giallo "forse"   → medium    (hold)
 *   blu    "lo so"   → farthest  (advance)
 *
 * Used for BOTH traduzione (en → it) and coniugazione (infinitive · tense ·
 * pronoun → form). Reveal is local state; grading goes through the deck store's
 * reviewCard. giallo/blu count toward the session tally via noteRead; rosso does not.
 */
export function ReadCard({ card, onFinishedAnswering }: ReadCardProps) {
  const [revealed, setRevealed] = useState(false);
  const noteRead = useSessionStore((s) => s.noteRead);
  const reviewCard = useDeckStore((s) => s.reviewCard);

  // Pick a conjugation cell ONCE per card mount (keyed on card.id upstream).
  // Non-verbs return null → fall through to the translation prompt.
  const conjugationPrompt = useMemo(
    () => pickConjugationPrompt(card),
    [card.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const isConjugation = conjugationPrompt !== null;
  const answer =
    isConjugation && conjugationPrompt ? conjugationPrompt.expected : card.it;
  const ctx = isConjugation ? "coniugazione" : "traduzione";

  function grade(g: ReviewGrade) {
    reviewCard(card.id, g, ctx, answer);
    if (g !== "rosso") noteRead();
    onFinishedAnswering();
  }

  return (
    <article
      className="card"
      data-state={revealed ? "revealed" : "prompt"}
      aria-live="polite"
    >
      <div className="lex">
        <div className="meta-block">
          <span className="pos">{card.cat}</span>
          <span className="sep" aria-hidden />
          <span>carta · {isConjugation ? "coniugazione" : "principale"}</span>
        </div>

        {isConjugation && conjugationPrompt ? (
          <>
            <div className="quiz-prompt">
              {conjugationPrompt.tenseLabel} · {conjugationPrompt.pronounLabel}
            </div>
            <h2 className="quiz-question">
              <em>{card.it}</em>
            </h2>
            <p className="english-hint" aria-hidden>
              ↳ {conjugationPrompt.englishLabel}
            </p>
          </>
        ) : (
          <>
            <div className="quiz-prompt">in italiano</div>
            <h2 className="quiz-question">{card.en}</h2>
          </>
        )}

        {!revealed ? (
          <button
            type="button"
            className="reveal-btn"
            onClick={() => setRevealed(true)}
            autoFocus
          >
            Mostra ↓
          </button>
        ) : (
          <div className="revealed-state">
            <p className="read-answer">{answer}</p>
            <div className="grade-row" role="group" aria-label="Quando rivedere">
              <button
                type="button"
                className="grade-btn rosso"
                onClick={() => grade("rosso")}
                aria-label="Da rivedere presto"
                autoFocus
              >
                <span className="grade-when">
                  {formatIntervalIt(reviewIntervalHours(card, "rosso"))}
                </span>
              </button>
              <button
                type="button"
                className="grade-btn giallo"
                onClick={() => grade("giallo")}
                aria-label="Da rivedere fra un po'"
              >
                <span className="grade-when">
                  {formatIntervalIt(reviewIntervalHours(card, "giallo"))}
                </span>
              </button>
              <button
                type="button"
                className="grade-btn blu"
                onClick={() => grade("blu")}
                aria-label="Lo so bene"
              >
                <span className="grade-when">
                  {formatIntervalIt(reviewIntervalHours(card, "blu"))}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Apparatus card={card} />
    </article>
  );
}
