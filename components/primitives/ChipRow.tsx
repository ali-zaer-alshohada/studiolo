import clsx from "clsx";
import type { ReactNode } from "react";

type ChipRowProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Flex row of chips with hairline dividers between, full row width.
 * First child anchors left; last anchors right (no padding on the outer edges).
 * Used for category filters in Coda and the Tweaks panel option groups.
 */
export function ChipRow({ children, className }: ChipRowProps) {
  return <div className={clsx("chip-row", className)} role="tablist">{children}</div>;
}

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Optional count badge displayed after the label, e.g. "Verbi · 7" */
  count?: number;
  className?: string;
};

export function Chip({ children, active = false, onClick, count, className }: ChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={clsx("chip", className)}
    >
      {children}
      {count !== undefined && <span className="n">{count}</span>}
    </button>
  );
}
