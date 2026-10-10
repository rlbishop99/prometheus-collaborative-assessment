import type { DailySummary, DayKey, IntradaySeries } from '../types.js';
import { filterValidBars } from './filterValidBars.js';
import { groupBarsByDay } from './groupBarsByDay.js';
import { summarizeDay } from './summarizeDay.js';

/**
 * Rocko Bishop
 * Runs the full aggregation pipeline: drop invalid bars, group by exchange-local day, trim to the
 * window, summarize, and sort ascending. Days with no valid bars are omitted.
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
 */
function isWithinWindow(day: DayKey, windowStartDayKey: DayKey): boolean {
  return day >= windowStartDayKey;
}

function compareByDayAscending(a: DailySummary, b: DailySummary): number {
  return a.day < b.day ? -1 : a.day > b.day ? 1 : 0;
}
