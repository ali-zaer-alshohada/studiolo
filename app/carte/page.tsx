import { CarteView } from "@/components/carte/CarteView";

/**
 * Carte — page xiii · l'intero mazzo.
 *
 * Browse every card in the deck with search + category filter. Click a row
 * to jump back to /aggiungi?edit=<id> for editing. The recent list on /aggiungi
 * shows the last 5; this page shows everything.
 */
export default function CartePage() {
  return (
    <section aria-labelledby="carte-heading">
      <h1 id="carte-heading" className="visually-hidden">
        Carte · pagina xiii · l&apos;intero mazzo
      </h1>
      <div className="section-label" aria-hidden>
        <span>Carte</span>
        <span className="rule" />
        <span className="pageno">xiii · mazzo</span>
      </div>

      <CarteView />
    </section>
  );
}
