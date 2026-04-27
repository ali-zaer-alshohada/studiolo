import { TocRow } from "@/components/primitives";

/**
 * Indice — the home view's table of contents. Four entries; the first three
 * are the daily-use views (Studiare / Dettatura / Aggiungi) numbered i / ii / iii.
 * Statistiche gets `-...` (the prototype's "and the rest" marker) because it's
 * the meta/concordance view, separate from the daily flow.
 */
export function Toc() {
  return (
    <nav className="toc" aria-label="Indice">
      <div className="toc-label">Indice</div>
      <TocRow marker={1} label="Studiare le carte di oggi" href="/studiare" />
      <TocRow marker={2} label="Dettatura · sentire e scrivere" href="/dettatura" />
      <TocRow marker={3} label="Aggiungere una carta nuova" href="/aggiungi" />
      <TocRow marker="-..." label="Statistiche · concordanza degli errori" href="/statistiche" />
    </nav>
  );
}
