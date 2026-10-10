export type Trend = 'up' | 'down' | 'neutral';

/** "Within 1%" of the latest day's value counts as neutral. */
const NEUTRAL_BAND = 0.01;

/**
 * Rocko Bishop
 * Compares a selected day's value with the latest (in-progress) day's value. Within +/-1% of the
 * latest is neutral; otherwise the direction is reported. A zero baseline cannot express a
 * percentage, so it falls back to a plain comparison.
 */
export function computeTrend(selected: number, latest: number): Trend {
  if (latest === 0) {
    return directionOf(selected);
  }
  const relativeChange = (selected - latest) / Math.abs(latest);
  if (Math.abs(relativeChange) <= NEUTRAL_BAND) {
    return 'neutral';
  }
  return directionOf(relativeChange);
}

function directionOf(difference: number): Trend {
  if (difference > 0) {
    return 'up';
  }
  return difference < 0 ? 'down' : 'neutral';
}
