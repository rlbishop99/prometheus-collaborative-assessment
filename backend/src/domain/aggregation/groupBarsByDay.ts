import { toExchangeDayKey } from '../time/exchangeDay.js';
import type { DayKey, ValidBar } from '../types.js';

/**
 * Rocko Bishop
 * Buckets bars by the calendar day they fall on in the exchange's timezone, which is the unit
 * every daily summary is computed over.
 */
export function groupBarsByDay(
  bars: readonly ValidBar[],
  timeZone: string,
): Map<DayKey, ValidBar[]> {
  const groups = new Map<DayKey, ValidBar[]>();
  for (const bar of bars) {
    const dayKey = toExchangeDayKey(bar.timestamp, timeZone);
    const bucket = groups.get(dayKey);
    if (bucket) {
      bucket.push(bar);
    } else {
      groups.set(dayKey, [bar]);
    }
  }
  return groups;
}
