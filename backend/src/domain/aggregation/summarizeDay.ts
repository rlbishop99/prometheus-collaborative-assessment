import { ceilToPrecision } from '../math/ceilToPrecision.js';
import { mean, safeIntegerSum } from '../math/statistics.js';
import type { DailySummary, DayKey, ValidBar } from '../types.js';

/**
 * Rocko Bishop
 * Reduces one day's bars to the public summary. The averages are rounded once, at the end, so
 * that per-bar rounding error never accumulates.
 * @param day - The exchange-local day being summarized.
 * @param bars - That day's validated bars; must not be empty.
 * @returns The day's mean low, mean high and total volume.
 */
export function summarizeDay(day: DayKey, bars: readonly ValidBar[]): DailySummary {
  if (bars.length === 0) {
    throw new RangeError(`Cannot summarize ${day}: no bars`);
  }
  return {
    day,
    lowAverage: ceilToPrecision(mean(bars.map((bar) => bar.low))),
    highAverage: ceilToPrecision(mean(bars.map((bar) => bar.high))),
    volume: safeIntegerSum(bars.map((bar) => bar.volume)),
  };
}
