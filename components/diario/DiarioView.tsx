"use client";

import { useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Card } from "@/lib/srs/types";

/**
 * Diary view — list of cards the user has collected (rung v + first
 * correct grants `collected`). Sorted by collection date, newest first.
 *
 * Each entry is editable: the sentence textarea saves on blur via
 * `setSentence`. Empty sentences are valid (just no save signal needed).
 */
export function DiarioView() {
  const hydrated = useHydrated();
  const cards = useDeckStore((s) => s.cards);
  const setSentence = useDeckStore((s) => s.setSentence);

  if (!hydrated) {
    return <div className="diario" aria-busy="true" />;
  }

  const collected: Card[] = cards
    .filter((c) => c.collected !== undefined)
    .sort((a, b) => (b.collected?.when ?? 0) - (a.collected?.when ?? 0));

  if (collected.length === 0) {
    return (
      <p className="diario-empty">
        <em>Nessuna carta raccolta ancora.</em> Quando padroneggi una carta al
        livello v, apparirà un certificato per aggiungerla qui.
      </p>
    );
  }

  return (
    <div className="diario">
      {collected.map((card) => (
        <DiarioEntry
          key={card.id}
          card={card}
          onSave={(s) => setSentence(card.id, s)}
        />
      ))}
    </div>
  );
}

type DiarioEntryProps = {
  card: Card;
  onSave: (sentence: string) => void;
};

function DiarioEntry({ card, onSave }: DiarioEntryProps) {
  const [draft, setDraft] = useState(card.collected?.sentence ?? "");
  const collectedAt = card.collected?.when
    ? new Date(card.collected.when).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <article className="diario-entry">
      <header className="diario-head">
        <h2 className="diario-it">
          <em>{card.it}</em>
        </h2>
        <p className="diario-en">{card.en}</p>
        <p className="diario-meta">
          <span>raccolta {collectedAt}</span>
          {card.cat && <span> · {card.cat}</span>}
        </p>
      </header>
      <label className="diario-sentence-label" htmlFor={`s-${card.id}`}>
        <em>una frase tua</em>
      </label>
      <textarea
        id={`s-${card.id}`}
        className="diario-sentence"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== (card.collected?.sentence ?? "")) {
            onSave(draft);
          }
        }}
        placeholder={`scrivi una frase con "${card.it}"…`}
        rows={2}
      />
    </article>
  );
}
