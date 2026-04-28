import { AlarmBanner } from "@/components/coda/AlarmBanner";
import { ErrataHero } from "@/components/coda/ErrataHero";
import { Toc } from "@/components/coda/Toc";
import { Filters } from "@/components/coda/Filters";
import { Colophon } from "@/components/coda/Colophon";

/**
 * Coda — the home view, page i.
 *
 * Composition (top to bottom):
 *   1. Section label
 *   2. (Conditional) AlarmBanner — only when backup is overdue and there are cards
 *   3. ErrataHero — last 3 errors, framed by heavy black rules. The hero.
 *   4. Toc (Indice) — links to Studiare/Dettatura/Aggiungi/Statistiche
 *   5. Filters — 5 chips: Tutte / Sostantivi / Verbi / Pronomi / Deboli
 *   6. Colophon — tot · oggi · serie · esattezza · 7g
 *
 * The order is the design's argument. Do not reorder.
 */
export default function CodaPage() {
  return (
    <section aria-labelledby="coda-heading">
      <h1 id="coda-heading" className="visually-hidden">Coda · pagina i</h1>
      <div className="section-label" aria-hidden>
        <span>Coda</span>
        <span className="rule" />
        <span className="pageno">i</span>
      </div>

      <AlarmBanner />
      <ErrataHero />
      <Toc />
      <Filters />
      <Colophon />
    </section>
  );
}
