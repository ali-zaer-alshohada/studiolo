import { todayStr } from "./todayStr";

export type StreakState = {
  streakLastDay: string | null;
  streakCount: number;
};

/**
 * Pure streak update. Ported from prototype line 1875 `bumpStreak`.
 *
 * Rules:
 *   - Same-day re-bump → no-op (no double-counting per session).
 *   - Last bump was yesterday → increment by 1.
 *   - Gap of 2+ days, or first ever → reset to 1.
 *   - Either way (except no-op), stamp today's string.
 */
export function bumpStreak(state: StreakState, now: number): StreakState {
  const today = todayStr(new Date(now));
  if (state.streakLastDay === today) return state;

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = todayStr(yesterdayDate);

  return {
    streakLastDay: today,
    streakCount: state.streakLastDay === yesterday ? state.streakCount + 1 : 1,
  };
}
