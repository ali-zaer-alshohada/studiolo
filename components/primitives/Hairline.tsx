import clsx from "clsx";

type HairlineProps = {
  /** weight in px; default 0.5 (the prototype's signature hair-thin rule). */
  weight?: number;
  /** color override; default var(--hair). Use var(--fg) for a stronger contextual rule. */
  color?: string;
  className?: string;
  /** vertical margin in px. */
  my?: number;
};

/**
 * The workhorse divider. 0.5px is the marker of typographic seriousness in Studiolo —
 * never default to 1px (that's "web defaults"; reserve 1px+ for emphatic separators
 * inside framed sections).
 */
export function Hairline({ weight = 0.5, color, className, my }: HairlineProps) {
  const style: React.CSSProperties = {};
  if (weight !== 0.5) style.height = `${weight}px`;
  if (color) style.background = color;
  if (my !== undefined) style.marginTop = my;
  if (my !== undefined) style.marginBottom = my;
  return <hr className={clsx("hairline", className)} style={style} aria-hidden />;
}
