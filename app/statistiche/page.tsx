import { StatTotals } from "@/components/statistiche/StatTotals";
import { Concordance } from "@/components/statistiche/Concordance";

/**
 * Statistiche — page xi · concordanza.
 *
 * The most "critical edition" view in the app: an apparatus criticus of every
 * mistake the user has ever produced, alphabetically indexed.
 */
export default function StatistichePage() {
  return (
    <section aria-labelledby="statistiche-heading">
      <h1 id="statistiche-heading" className="visually-hidden">Statistiche · pagina xi · concordanza</h1>
      <div className="section-label" aria-hidden>
        <span>Statistiche</span>
        <span className="rule" />
        <span className="pageno">xi · concordanza</span>
      </div>

      <StatTotals />

      <header className="conc-head">
        <em>Concordanza degli errori</em>
        <span> · indice alfabetico · ogni inciampo ricordato</span>
      </header>

      <Concordance />
    </section>
  );
}
