"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { useSessionStore } from "@/lib/store/session";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { shuffle, clampSession } from "@/lib/srs/queue";
import type { Card } from "@/lib/srs/types";
import { SessionBar } from "./SessionBar";
import { QuizCard } from "./QuizCard";

type StudyMode = "traduzione" | "coniugazione" | "gioco";

/**
 * Page-level coordinator for /studiare. Shows a 3-mode picker first
 * (traduzione / coniugazione / gioco). On mode pick, filters today's due
 * cards and starts the session. Esc anywhere on the page returns to Coda.
 *
 * "gioco" is deferred — clicking shows an "in arrivo" tooltip but does
 * not start a session.
 */
export function StudiareView() {
  const hydrated = useHydrated();
  const router = useRouter();

  const cards = useDeckStore((s) => s.cards);
  const active = useSessionStore((s) => s.active);
  const startSession = useSessionStore((s) => s.start);
  const advance = useSessionStore((s) => s.advance);
  const abort = useSessionStore((s) => s.abort);

  const [mode, setMode] = useState<StudyMode | null>(null);
  const [gameTip, setGameTip] = useState(false);

  function pickMode(m: StudyMode) {
    if (m === "gioco") {
      setGameTip(true);
      window.setTimeout(() => setGameTip(false), 2400);
      return;
    }
    abort();
    setMode(m);
    // Filter the entire deck by mode first so the padding pool is also
    // mode-correct (a coniugazione session doesn't get padded with non-verb
    // translation cards).
    const modeEligible = filterByMode(cards, m);
    const due = modeEligible.filter((c) => c.due <= Date.now());
    const clamped = clampSession(due, modeEligible, 20, 30);
    if (clamped.length > 0) {
      startSession(shuffle(clamped).map((c) => c.id));
    }
  }

  function backToPicker() {
    abort();
    setMode(null);
  }

  if (!hydrated) {
    return (
      <section aria-labelledby="studiare-heading">
        <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
        <div className="section-label" aria-hidden>
          <span>Studiare</span>
          <span className="rule" aria-hidden />
          <span className="pageno">iii</span>
        </div>
      </section>
    );
  }

  // No active session AND no mode picked yet → show the 3-mode picker.
  if (!active && !mode) {
    return (
      <section aria-labelledby="studiare-heading">
        <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
        <div className="section-label" aria-hidden>
          <span>Studiare</span>
          <span className="rule" aria-hidden />
          <span className="pageno">iii · scegli il modo</span>
        </div>
        <p className="mode-prompt">
          <em>Studiare le carte di oggi</em> · scegli il modo
        </p>
        <div className="mode-picker" role="group" aria-label="Modo di studio">
          <button
            type="button"
            className="mode-chip"
            onClick={() => pickMode("traduzione")}
          >
            <span className="mode-chip-label">traduzione</span>
            <span className="mode-chip-hint">en → it</span>
          </button>
          <button
            type="button"
            className="mode-chip"
            onClick={() => pickMode("coniugazione")}
          >
            <span className="mode-chip-label">coniugazione</span>
            <span className="mode-chip-hint">solo verbi</span>
          </button>
          <button
            type="button"
            className="mode-chip mode-chip--soon"
            onClick={() => pickMode("gioco")}
            aria-label="Gioco — in arrivo"
          >
            <span className="mode-chip-label">gioco</span>
            <span className="mode-chip-hint">presto</span>
          </button>
        </div>
        <p
          className="mode-tip"
          role="status"
          aria-live="polite"
          data-visible={gameTip ? "1" : "0"}
        >
          <em>In arrivo.</em> Stiamo ancora pensando come si gioca.
        </p>
      </section>
    );
  }

  // Mode picked but no due cards for that mode → empty state with a back link.
  if (!active && mode) {
    return (
      <section aria-labelledby="studiare-heading">
        <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
        <div className="section-label" aria-hidden>
          <span>Studiare</span>
          <span className="rule" aria-hidden />
          <span className="pageno">iii · {mode}</span>
        </div>
        <p className="empty-line">
          <em>Nessuna carta da rivedere</em> in modo <em>{mode}</em>. Riposa, oppure{" "}
          <a href="/aggiungi" style={{ color: "var(--accent)" }}>aggiungine</a>.
        </p>
        <p className="mode-back">
          <button type="button" className="link-btn" onClick={backToPicker}>
            ← cambia modo
          </button>
        </p>
      </section>
    );
  }

  // Session finished (cursor past end).
  if (active && active.idx >= active.queue.length) {
    return (
      <section aria-labelledby="studiare-heading">
        <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
        <div className="section-label" aria-hidden>
          <span>Studiare</span>
          <span className="rule" aria-hidden />
          <span className="pageno">iii · finita</span>
        </div>
        <div className="session-end">
          <h2 className="session-end-title">Sessione finita.</h2>
          <p className="session-end-stats">
            <span className="v">{active.correctCount}</span> giuste su{" "}
            <span className="v">{active.queue.length}</span>.
          </p>
          <button
            type="button"
            className="avanti-btn"
            onClick={() => {
              abort();
              router.push("/");
            }}
            autoFocus
          >
            Torna a Coda →
          </button>
        </div>
      </section>
    );
  }

  // Active card.
  const cardId = active!.queue[active!.idx];
  const currentCard = cards.find((c) => c.id === cardId);
  if (!currentCard) {
    // Card was deleted mid-session — just advance.
    advance();
    return null;
  }

  return (
    <section aria-labelledby="studiare-heading">
      <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
      <div className="section-label" aria-hidden>
        <span>Studiare</span>
        <span className="rule" aria-hidden />
        <span className="pageno">iii · sessione</span>
      </div>

      <SessionBar done={active!.idx} total={active!.queue.length} />
      <QuizCard
        key={currentCard.id}
        card={currentCard}
        onFinishedAnswering={() => advance()}
      />
    </section>
  );
}

/** Today's due cards, narrowed to the picked study mode. */
function filterByMode(due: Card[], mode: StudyMode): Card[] {
  return due
    .filter((c) => c.paragraph === undefined)
    .filter((c) => {
      if (mode === "traduzione") return c.conj === undefined;
      if (mode === "coniugazione") return c.conj !== undefined;
      return false;
    });
}
