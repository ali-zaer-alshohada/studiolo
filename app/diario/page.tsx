import { DiarioView } from "@/components/diario/DiarioView";

/**
 * Diario — page xv · le carte raccolte.
 *
 * Where words mastered (rung v + collected) live a second life:
 * the user writes a sentence using each, turning vocabulary into prose.
 */
export default function DiarioPage() {
  return (
    <section aria-labelledby="diario-heading">
      <h1 id="diario-heading" className="visually-hidden">
        Diario · pagina xv · carte raccolte
      </h1>
      <div className="section-label" aria-hidden>
        <span>Diario</span>
        <span className="rule" />
        <span className="pageno">xv · raccolta</span>
      </div>

      <DiarioView />
    </section>
  );
}
