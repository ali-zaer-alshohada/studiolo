"use client";

import type { DettaturaResult } from "@/lib/srs/dettatura";

type Props = {
  result: DettaturaResult;
};

/**
 * Three-row feedback block:
 *   ATTESA — the canonical correct answer in italic --errata
 *   TUA    — the user's input, with mismatched words struck-through
 *   verdict — italic Iowan, accent-coloured "esatta" or "riprovare" copy
 */
export function DettaturaFeedback({ result }: Props) {
  return (
    <div className="dett-feedback">
      <div className="row target">
        <span className="lbl">attesa</span>
        <span className="v">{result.target}</span>
      </div>
      <div className="row yours">
        <span className="lbl">tua</span>
        <span className="v">
          {result.diff.length === 0 ? (
            "—"
          ) : (
            result.diff.map((d, i) => (
              <span key={i} className={d.kind}>
                {d.word}
                {i < result.diff.length - 1 ? " " : ""}
              </span>
            ))
          )}
        </span>
      </div>
      <div className="verdict">
        {result.ok ? (
          <em className="ok">a memoria · esatta.</em>
        ) : (
          <>
            l&apos;orecchio aveva ragione, la mano no. <em>riprovare</em>.
          </>
        )}
      </div>
    </div>
  );
}
