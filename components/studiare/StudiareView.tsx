"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { useSessionStore } from "@/lib/store/session";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { dueToday, shuffle } from "@/lib/srs/queue";
import { SessionBar } from "./SessionBar";
import { QuizCard } from "./QuizCard";

/**
 * Page-level coordinator for /studiare. Reads the deck store, starts a session
 * once on mount if there are due cards, advances on `onFinishedAnswering`,
 * shows an empty state when there's nothing due, and a session-end summary
 * when finished. Esc anywhere on the page returns to Coda.
 */
export function StudiareView() {
  const hydrated = useHydrated();
  const router = useRouter();

  const cards = useDeckStore((s) => s.cards);
  const active = useSessionStore((s) => s.active);
  const startSession = useSessionStore((s) => s.start);
  const advance = useSessionStore((s) => s.advance);
  const abort = useSessionStore((s) => s.abort);

  // Start a session once we hydrate (and only if not already active).
  useEffect(() => {
    if (!hydrated) return;
    if (active) return;
    const due = dueToday(cards, Date.now());
    if (due.length === 0) return;
    startSession(shuffle(due).map((c) => c.id));
  }, [hydrated, active, cards, startSession]);

  // Esc-to-Coda is now handled globally in ClientShell via useEscToCoda.
  // The session is intentionally NOT aborted on Esc — leaving the page
  // simply returns the user to Coda; re-visiting /studiare picks up from
  // where they left off because the active session is in-memory only.

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

  // No active session AND there were no due cards → empty state.
  if (!active) {
    return (
      <section aria-labelledby="studiare-heading">
        <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
        <div className="section-label" aria-hidden>
          <span>Studiare</span>
          <span className="rule" aria-hidden />
          <span className="pageno">iii · sessione</span>
        </div>
        <p className="empty-line">
          <em>Nessuna carta da rivedere.</em> Riposa, oppure{" "}
          <a href="/aggiungi" style={{ color: "var(--accent)" }}>aggiungine</a>.
        </p>
      </section>
    );
  }

  // Session finished (cursor past end).
  if (active.idx >= active.queue.length) {
    return (
      <section aria-labelledby="studiare-heading">
        <h1 id="studiare-heading" className="visually-hidden">Studiare · pagina iii</h1>
        <div className="section-label" aria-hidden>
          <span>Studiare</span>
          <span className="rule" aria-hidden />
          <span className="pageno">iii · finita</span>
        </div>
        <div className="session-end">
          <h2 className="session-end-title">
            Sessione finita.
          </h2>
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
  const cardId = active.queue[active.idx];
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

      <SessionBar done={active.idx} total={active.queue.length} />
      <QuizCard
        key={currentCard.id}
        card={currentCard}
        onFinishedAnswering={() => advance()}
      />
    </section>
  );
}
