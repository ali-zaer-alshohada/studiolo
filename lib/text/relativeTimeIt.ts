/**
 * Italian relative-time formatter for the Coda errata block.
 *
 * The README's examples: "stamane" (this morning), "ieri sera" (yesterday evening),
 * "due giorni fa" (two days ago). The exact phrasing is *part of the design* —
 * Italian relative-time idioms are different from English ("yesterday morning"
 * is awkward in Italian; "ieri mattina" is natural).
 *
 * TODO(ali): refine the bucket boundaries and copy. The current implementation is a
 * defensible scaffold but not idiomatic. Things to consider:
 *   - Time-of-day flavor in same-day buckets (stamane / oggi pomeriggio / stasera)
 *   - "ieri" subdivision (ieri mattina / ieri sera)
 *   - "due giorni fa" vs "l'altroieri" (the latter is more Tuscan/dated)
 *   - Week/month thresholds — "una settimana fa" vs explicit date for older
 *
 * Keep the function pure (takes a timestamp + optional `now`) so it's unit-testable.
 */
export function relativeTimeIt(when: number, now: number = Date.now()): string {
  const diffMs = now - when;
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;

  // Same calendar day → "stamane" / "oggi pomeriggio" / "stasera"
  const sameDay = isSameLocalDay(when, now);
  if (sameDay) {
    const hour = new Date(when).getHours();
    if (hour < 12) return "stamane";
    if (hour < 18) return "oggi pomeriggio";
    return "stasera";
  }

  // Yesterday
  if (isYesterday(when, now)) {
    const hour = new Date(when).getHours();
    if (hour < 12) return "ieri mattina";
    if (hour < 18) return "ieri pomeriggio";
    return "ieri sera";
  }

  if (days < 7) return `${days} giorni fa`;
  if (days < 30) return `${Math.floor(days / 7)} settimane fa`;

  // Older — fall back to a date stamp.
  const d = new Date(when);
  const months = [
    "gen", "feb", "mar", "apr", "mag", "giu",
    "lug", "ago", "set", "ott", "nov", "dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function isSameLocalDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function isYesterday(when: number, now: number): boolean {
  const w = new Date(when);
  const n = new Date(now);
  const yesterday = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
  return (
    w.getFullYear() === yesterday.getFullYear() &&
    w.getMonth() === yesterday.getMonth() &&
    w.getDate() === yesterday.getDate()
  );
}
