"use client";

type SessionBarProps = {
  done: number;
  total: number;
};

/**
 * Top-of-page progress bar.
 * `sessione · N di T`  ──────●───  N / T
 */
export function SessionBar({ done, total }: SessionBarProps) {
  const pct = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <div className="session-bar">
      <span className="title">sessione · {done} di {total}</span>
      <div className="progress" aria-hidden>
        <div className="fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="count">{done} / {total}</span>
    </div>
  );
}
