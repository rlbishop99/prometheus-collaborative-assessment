import type { IntradayBar, ValidBar } from '../types.js';

/**
 * Rocko Bishop
 * Keeps only bars that are safe to aggregate. Upstream gaps arrive as null or NaN fields and must
 * never reach the averages.
 */
export function filterValidBars(bars: readonly IntradayBar[]): ValidBar[] {
  const valid: ValidBar[] = [];
  for (const bar of bars) {
    if (isValidBar(bar)) {
      valid.push(bar);
    }
  }
  return valid;
}

/**
 * Rocko Bishop
 * Checks one bar: a finite timestamp, non-negative finite prices with `low <= high`, and a
 * non-negative integer volume.
 */
function isValidBar(bar: IntradayBar): bar is ValidBar {
  return (
    Number.isFinite(bar.timestamp) &&
    isNonNegativeFinite(bar.low) &&
    isNonNegativeFinite(bar.high) &&
    bar.low <= bar.high &&
    isNonNegativeInteger(bar.volume)
  );
}

function isNonNegativeFinite(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value >= 0;
}
