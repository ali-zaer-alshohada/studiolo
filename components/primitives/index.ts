/**
 * Critical-edition primitives — the typographic atoms shared across all 5 views.
 * Composition rule: views are mostly compositions of these. Avoid one-off
 * styling in views; if you find yourself duplicating a primitive, extract it here.
 */
export { Hairline } from "./Hairline";
export { RuleAbove, RuleBelow } from "./Rule";
export { SmallCaps } from "./SmallCaps";
export { RomanNumeral, PageNumber, toRoman } from "./Roman";
export { ChipRow, Chip } from "./ChipRow";
export { TocRow } from "./TocRow";
export { ErrataLine } from "./ErrataLine";
