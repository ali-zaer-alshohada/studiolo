import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

type RuleProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Heavy black rule above (3px var(--fg) by default). Used to bracket the
 * errata hero. Distinct from <Hairline> so the meaning is in the JSX —
 * "this is a frame," not "this is a divider."
 */
export function RuleAbove({ children, className, style }: RuleProps) {
  return <div className={clsx("rule-above", className)} style={style}>{children}</div>;
}

/** Heavy black rule below (3px var(--fg) by default). */
export function RuleBelow({ children, className, style }: RuleProps) {
  return <div className={clsx("rule-below", className)} style={style}>{children}</div>;
}
