"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/store/deck";
import { ConjugationEditor } from "@/components/aggiungi/verbo/ConjugationEditor";

/**
 * Aggiungi · verbo — page vi.
 * Dedicated route for adding a verb with full conjugation tables. Kept
 * separate from /aggiungi (Phase 1 writing surface) so that the main
 * Aggiungi stays uncluttered.
 */
export default function AggiungiVerboPage() {
  const router = useRouter();
  const addVerbCard = useDeckStore((s) => s.addVerbCard);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <section>
      <div className="section-label">
        <span>Aggiungi · verbo</span>
        <span className="rule" aria-hidden />
        <span className="pageno">vi · coniugazione</span>
      </div>

      <p className="empty-line" style={{ marginTop: 12, marginBottom: 32 }}>
        <em>Scrivi l&apos;infinito, premi &laquo;regolare&raquo;</em>, correggi gli irregolari a mano, iscrivi.
      </p>

      <ConjugationEditor
        onSave={({ infinitive, en, conj }) => {
          addVerbCard({ en, it: infinitive, conj });
          setFeedback(`iscritto · ${infinitive}`);
          window.setTimeout(() => router.push("/aggiungi"), 800);
        }}
        onCancel={() => router.push("/aggiungi")}
      />

      {feedback && (
        <p className="aggiungi-feedback" role="status">{feedback}</p>
      )}
    </section>
  );
}
