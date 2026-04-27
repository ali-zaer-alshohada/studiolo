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
    <section>
      <div className="section-label">
        <span>Statistiche</span>
        <span className="rule" aria-hidden />
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
