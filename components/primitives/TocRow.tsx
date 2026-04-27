import clsx from "clsx";
import Link from "next/link";
import { toRoman } from "./Roman";

type TocRowProps = {
  /**
   * Marker for the row. A number renders as a lowercase Roman numeral
   * (`i`, `ii`, `iii`, …); a string renders as-is — useful for special
   * markers like `-...` (the prototype's "and the rest" indicator) or
   * lettered ordinals.
   */
  marker: number | string;
  /** The view's name, e.g. "Studiare", "Aggiungi". */
  label: string;
  /** Optional href; if omitted, renders as a plain row (no nav). */
  href?: string;
  /** Optional right-side glyph; defaults to "→". */
  arrow?: string;
  className?: string;
};

function renderMarker(marker: number | string): string {
  return typeof marker === "number" ? toRoman(marker) : marker;
}

/**
 * Indice / table-of-contents row. Marker on left, label, arrow on right.
 * Hover slides the row right; the arrow leads. Used in Coda's ToC.
 */
export function TocRow({ marker, label, href, arrow = "→", className }: TocRowProps) {
  const inner = (
    <>
      <span className="num">{renderMarker(marker)}</span>
      <span className="name">{label}</span>
      <span className="arrow" aria-hidden>{arrow}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={clsx("toc-row", className)}>
        {inner}
      </Link>
    );
  }
  return <div className={clsx("toc-row", className)}>{inner}</div>;
}
