import clsx from "clsx";

const ROMAN_PAIRS: ReadonlyArray<readonly [number, string]> = [
  [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
  [100, "c"],  [90, "xc"],  [50, "l"],  [40, "xl"],
  [10, "x"],   [9, "ix"],   [5, "v"],   [4, "iv"],
  [1, "i"],
];

/**
 * Convert a positive integer (1..3999) to lowercase Roman numerals.
 * Returns "" for n <= 0 (so callers can render nothing without branching).
 */
export function toRoman(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  let remaining = Math.floor(n);
  let out = "";
  for (const [value, symbol] of ROMAN_PAIRS) {
    while (remaining >= value) {
      out += symbol;
      remaining -= value;
    }
  }
  return out;
}

type RomanNumeralProps = {
  n: number;
  /** "lower" (default) or "upper" — affects display only; toRoman is always lowercase. */
  case?: "lower" | "upper";
  /** Optional suffix character. Common: "." for ordinals (i. ii. iii.) */
  suffix?: string;
  className?: string;
};

/**
 * Italic Iowan Roman numeral — used for ordinal markers (errata 1, 2, 3),
 * stato dividers (`stato i · prompt`), and section page numbers.
 */
export function RomanNumeral({
  n,
  case: caseStyle = "lower",
  suffix = "",
  className,
}: RomanNumeralProps) {
  return (
    <span className={clsx("roman", caseStyle, className)}>
      {toRoman(n)}
      {suffix}
    </span>
  );
}

type PageNumberProps = {
  n: number;
  className?: string;
};

/** Lowercase italic Roman page number, e.g. `lxxxix` for card 89. */
export function PageNumber({ n, className }: PageNumberProps) {
  return <span className={clsx("roman lower pageno", className)}>{toRoman(n)}</span>;
}
