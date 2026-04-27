/**
 * Format a date as YYYY-M-D in local time, NOT zero-padded.
 *
 * Ported from prototype line 1872:
 *     d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate()
 *
 * Zero-padding would be more conventional, but this format is what existing
 * prototype-user data is keyed by — we preserve it verbatim.
 *
 * TODO(ali): timezone-naive — uses local time without normalisation. Crossing
 * midnight in a different timezone (or a DST transition) can cause a streak
 * break or double-count. Fix requires a "primary timezone" UI choice; out of
 * scope for the port. Flagged in the plan, file J.
 */
export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
