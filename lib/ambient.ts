/**
 * Map an hour-of-day (0..23) to a `--warm` value (-1..+1) that drives the
 * ambient background hue. Five buckets, ported verbatim from prototype 2616.
 *
 *   < 6   → -0.6   night cool (pre-dawn)
 *   < 9   →  0.2   dawn warming
 *   < 18  →  0.3   afternoon
 *   < 21  →  0.8   dusk warm
 *   else  → -0.4   night cool (post-evening)
 *
 * Pure — call `useAmbientWarmth` (M10) for the React side that calls this on
 * an interval and writes the result to `document.documentElement.style`.
 */
export function currentWarm(hour: number): number {
  if (hour < 6) return -0.6;
  if (hour < 9) return 0.2;
  if (hour < 18) return 0.3;
  if (hour < 21) return 0.8;
  return -0.4;
}
