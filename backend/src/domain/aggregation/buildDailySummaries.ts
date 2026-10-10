import type { DailySummary, DayKey, IntradaySeries } from '../types.js';
import { filterValidBars } from './filterValidBars.js';
import { groupBarsByDay } from './groupBarsByDay.js';
import { summarizeDay } from './summarizeDay.js';

/**
 * Rocko Bishop
 * Runs the full aggregation pipeline: drop invalid bars, group by exchange-local day, trim to the
 * window, summarize, and sort ascending. Days with no valid bars are omitted.
 * @param series - Intraday data for one symbol.
 * @param windowStartDayKey - First day to include, as `YYYY-MM-DD`.
 * @returns Per-day summaries in ascending day order.
 */
export function buildDailySummaries(
  series: IntradaySeries,
  windowStartDayKey: DayKey,
): DailySummary[] {
  const groups = groupBarsByDay(filterValidBars(series.bars), series.timeZone);

  const summaries: DailySummary[] = [];
  for (const [day, bars] of groups) {
    if (isWithinWindow(day, windowStartDayKey)) {
      summaries.push(summarizeDay(day, bars));
    }
  }
  return summaries.sort(compareByDayAscending);
}

/**
 * Rocko Bishop
 * Window membership test. Day keys are zero-padded ISO dates, so string order is chronological
 * order.
 * @param day - The day to test.
 * @param windowStartDayKey - The window's first day.
 * @returns True when `day` is on or after the window start.
 */
function isWithinWindow(day: DayKey, windowStartDayKey: DayKey): boolean {
  return day >= windowStartDayKey;
}

/**
 * Rocko Bishop
 * Sort comparator that orders summaries from oldest to newest day.
 * @param a - First summary.
 * @param b - Second summary.
 * @returns Negative, zero or positive, per the Array#sort contract.
 */
function compareByDayAscending(a: DailySummary, b: DailySummary): number {
  return a.day < b.day ? -1 : a.day > b.day ? 1 : 0;
}
