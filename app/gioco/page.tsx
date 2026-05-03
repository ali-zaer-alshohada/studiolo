import { GiocoView } from "@/components/gioco/GiocoView";

/**
 * Gioco — page ix · memoria.
 *
 * Memory-match game. Pool = cards the user has missed in studiare
 * (`giocoLives > 0`, set by gradeWrong). 4×4 grid of 8 pairs. Each match
 * grants +1 charge in CAMMINO and decrements that card's giocoLives;
 * the card leaves the pool when lives reach 0 (3 matches to graduate).
 */
export default function GiocoPage() {
  return (
    <section aria-labelledby="gioco-heading">
      <h1 id="gioco-heading" className="visually-hidden">
        Gioco · pagina ix · memoria
      </h1>
      <div className="section-label" aria-hidden>
        <span>Gioco</span>
        <span className="rule" />
        <span className="pageno">ix · memoria</span>
      </div>
      <GiocoView />
    </section>
  );
}
