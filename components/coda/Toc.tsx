import { TocRow } from "@/components/primitives";

/**
 * Indice — the home view's table of contents. The first four are daily-use
 * views (Studiare / Dettatura / Aggiungi / Diario) numbered i / ii / iii / iv.
 * Statistiche gets `-...` (the prototype's "and the rest" marker) because it's
 * the meta/concordance view, separate from the daily flow.
 */
export function Toc() {
  return (
    <nav className="toc" aria-label="Indice">
      <TocRow marker={1} label="Studiare le carte di oggi" href="/studiare" />
      <TocRow marker={2} label="Dettatura · sentire e scrivere" href="/dettatura" />
      <TocRow marker={3} label="Aggiungere una carta nuova" href="/aggiungi" />
      <TocRow marker={4} label="Diario · le carte raccolte" href="/diario" />
      <TocRow marker="-..." label="Statistiche · concordanza degli errori" href="/statistiche" />
    </nav>
  );
}
