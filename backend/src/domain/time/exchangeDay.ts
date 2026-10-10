import type { DayKey } from '../types.js';

/** Intl formatters are expensive to construct, so one is cached per timezone. */
const formattersByTimeZone = new Map<string, Intl.DateTimeFormat>();

/**
 * Rocko Bishop
 * Checks whether the runtime can format dates in a timezone, so that bad upstream metadata can be
 * rejected before aggregation.
 * @param timeZone - IANA timezone name, e.g. `America/New_York`.
 * @returns True when the timezone is supported.
 */
export function isSupportedTimeZone(timeZone: string): boolean {
  try {
    getDayFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rocko Bishop
 * Converts a bar timestamp to the calendar day it falls on at the exchange, which is how bars are
 * grouped into days.
 * @param epochSeconds - Timestamp in epoch seconds.
 * @param timeZone - IANA timezone of the exchange.
 * @returns The exchange-local day as `YYYY-MM-DD`.
 */
export function toExchangeDayKey(epochSeconds: number, timeZone: string): DayKey {
  if (!Number.isFinite(epochSeconds)) {
    throw new RangeError(`Invalid timestamp: ${String(epochSeconds)}`);
  }
  return toDayKey(new Date(epochSeconds * 1000), timeZone);
}

/**
 * Rocko Bishop
 * Formats an instant as the calendar day observed in a timezone. Using formatToParts keeps this
 * independent of locale-specific date ordering.
 * @param instant - The moment in time.
 * @param timeZone - IANA timezone to observe the instant in.
 * @returns The local day as `YYYY-MM-DD`.
 */
export function toDayKey(instant: Date, timeZone: string): DayKey {
  const parts = getDayFormatter(timeZone).formatToParts(instant);
  const year = findPart(parts, 'year');
  const month = findPart(parts, 'month');
  const day = findPart(parts, 'day');
  return `${year}-${month}-${day}`;
}

/**
 * Rocko Bishop
 * Returns a cached day formatter for a timezone, creating it on first use. Throws RangeError for
 * unknown zones and leaves it to callers to decide how to surface that.
 * @param timeZone - IANA timezone name.
 * @returns A formatter producing zero-padded year, month and day parts.
 */
function getDayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formattersByTimeZone.get(timeZone);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  formattersByTimeZone.set(timeZone, formatter);
  return formatter;
}

/**
 * Rocko Bishop
 * Extracts one named part from formatter output, failing loudly if the runtime omits it.
 * @param parts - Output of `Intl.DateTimeFormat#formatToParts`.
 * @param type - The part to find, e.g. `year`.
 * @returns The part's string value.
 */
function findPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const part = parts.find((candidate) => candidate.type === type);
  if (!part) {
    throw new Error(`Date formatter did not produce a "${type}" part`);
  }
  return part.value;
}
