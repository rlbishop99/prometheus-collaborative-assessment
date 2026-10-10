import type { IntradayBar, ValidBar } from '../types.js';

/**
 * Rocko Bishop
 * Keeps only bars that are safe to aggregate. Upstream gaps arrive as null or NaN fields and must
 * never reach the averages.
 * @param bars - Raw bars from a provider.
 * @returns The bars that passed validation, in their original order.
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
 * @param bar - The raw bar to check.
 * @returns True (narrowing to ValidBar) when the bar is safe to aggregate.
 */
export function isValidBar(bar: IntradayBar): bar is ValidBar {
  return (
    Number.isFinite(bar.timestamp) &&
    isNonNegativeFinite(bar.low) &&
    isNonNegativeFinite(bar.high) &&
    bar.low <= bar.high &&
    isNonNegativeInteger(bar.volume)
  );
}

/**
 * Rocko Bishop
 * Price guard: rejects null, NaN, infinities and negatives.
 * @param value - The price to check.
 * @returns True (narrowing to number) for a usable price.
 */
function isNonNegativeFinite(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

/**
 * Rocko Bishop
 * Volume guard: rejects null, fractions, negatives and unsafe integers.
 * @param value - The volume to check.
 * @returns True (narrowing to number) for a usable volume.
 */
function isNonNegativeInteger(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value >= 0;
}
