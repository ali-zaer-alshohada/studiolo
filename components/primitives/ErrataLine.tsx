import clsx from "clsx";
import { relativeTimeIt } from "@/lib/text/relativeTimeIt";
import { RomanNumeral } from "./Roman";

type ErrataLineProps = {
  /** 1-based ordinal — renders as "i.", "ii.", "iii." in italic Iowan on the left. */
  index: number;
  /** The user's wrong answer — rendered muted, monospace, line-through. */
  wrong: string;
  /** The correct answer (the emendation) — rendered italic Iowan in --errata. */
  correct: string;
  /** Optional context tag, e.g. "genere", "ausiliare", "preposizione". */
  ctx?: string;
  /** Epoch ms when the error was logged. Formatted via `relativeTimeIt`. */
  when: number;
  className?: string;
};

/**
 * The canonical 3-line errata block — the emotional heart of Coda. Encodes
 * Studiolo's *never co-occur* invariant: --errata is the only red here, and
 * it's only on the italic .corr line. The wrong line stays muted gray
 * forever (the design rule: "no color flags wrongness").
 */
export function ErrataLine({
  index,
  wrong,
  correct,
  ctx,
  when,
  className,
}: ErrataLineProps) {
  return (
    <div className={clsx("erratum", className)} role="listitem">
      <div className="num">
        <RomanNumeral n={index} suffix="." />
      </div>
      <div className="pair">
        <div className="wrong">{wrong}</div>
        <div className="corr">{correct}</div>
      </div>
      <div className="meta">
        <span className="when">{relativeTimeIt(when)}</span>
        {ctx && <span className="ctx">{ctx}</span>}
      </div>
    </div>
  );
}
