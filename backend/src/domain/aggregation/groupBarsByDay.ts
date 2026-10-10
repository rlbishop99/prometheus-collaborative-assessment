import { toExchangeDayKey } from '../time/exchangeDay.js';
import type { DayKey, ValidBar } from '../types.js';

/**
 * Rocko Bishop
 * Buckets bars by the calendar day they fall on in the exchange's timezone, which is the unit
 * every daily summary is computed over.
 * @param bars - Validated bars.
 * @param timeZone - IANA timezone of the exchange.
 * @returns A map from exchange-local day to that day's bars, in first-seen order.
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
