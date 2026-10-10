export type Trend = 'up' | 'down' | 'neutral';

/** "Within 1%" of the latest day's value counts as neutral. */
export const NEUTRAL_BAND = 0.01;

/**
 * Rocko Bishop
 * Compares a selected day's value with the latest (in-progress) day's value. Within +/-1% of the
 * latest is neutral; otherwise the direction is reported. A zero baseline cannot express a
 * percentage, so it falls back to a plain comparison.
 * @param selected - The value on the selected day.
 * @param latest - The value on the latest day.
 * @returns `up` when higher, `down` when lower, `neutral` when within 1%.
 */
export function computeTrend(selected: number, latest: number): Trend {
  if (!Number.isFinite(selected) || !Number.isFinite(latest)) {
    return 'neutral';
  }
  if (latest === 0) {
    return directionOf(selected);
  }
  const relativeChange = (selected - latest) / Math.abs(latest);
  if (Math.abs(relativeChange) <= NEUTRAL_BAND) {
    return 'neutral';
  }
  return directionOf(relativeChange);
}

/**
 * Rocko Bishop
 * Maps the sign of a difference to a trend.
 * @param difference - Positive, negative or zero.
 * @returns The matching trend.
 */
function directionOf(difference: number): Trend {
  if (difference > 0) {
    return 'up';
  }
  return difference < 0 ? 'down' : 'neutral';
}
