/**
 * Normalize a user-facing string for comparison: lowercase, trimmed, with
 * trailing punctuation stripped and runs of whitespace collapsed. Italian
 * accented characters (à è é ì ò ù) are PRESERVED — they're meaningful in
 * Italian orthography ("perchè" vs "perché", "sé" vs "se").
 *
 * Ported from prototype line 1859 (`function norm`).
 */
export function normalize(input: string | null | undefined): string {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ");
}
