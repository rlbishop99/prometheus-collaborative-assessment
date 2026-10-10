import { ceilToPrecision } from '../math/ceilToPrecision.js';
import { mean, safeIntegerSum } from '../math/statistics.js';
import type { DailySummary, DayKey, ValidBar } from '../types.js';

/**
 * Rocko Bishop
 * Reduces one day's bars to the public summary. The averages are rounded once, at the end, so
 * that per-bar rounding error never accumulates.
 * @param bars - That day's validated bars; never empty, because days come from grouping bars.
 */
export function summarizeDay(day: DayKey, bars: readonly ValidBar[]): DailySummary {
  return {
    day,
    lowAverage: ceilToPrecision(mean(bars.map((bar) => bar.low))),
    highAverage: ceilToPrecision(mean(bars.map((bar) => bar.high))),
    volume: safeIntegerSum(bars.map((bar) => bar.volume)),
  };
}
