import clsx from "clsx";
import type { ReactNode } from "react";

type SmallCapsProps = {
  children: ReactNode;
  /** letter-spacing in em; default 0.18 (matches prototype labels). */
  tracking?: number;
  className?: string;
  /** Render as <span> by default; pass element for semantics (e.g. "h2"). */
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Uppercase + tracked monospace label. Used for section labels, chip labels,
 * date stamps, and any "chrome" copy. The tracking is what makes it feel
 * like a printed page header rather than a CSS button.
 */
export function SmallCaps({ children, tracking = 0.18, className, as = "span" }: SmallCapsProps) {
  const Tag = as as "span";
  return (
    <Tag
      className={clsx("small-caps", className)}
      style={{ letterSpacing: `${tracking}em` }}
    >
      {children}
    </Tag>
  );
}
