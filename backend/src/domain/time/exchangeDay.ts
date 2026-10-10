import type { DayKey } from '../types.js';

/** Intl formatters are expensive to construct, so one is cached per timezone. */
const formattersByTimeZone = new Map<string, Intl.DateTimeFormat>();

/**
 * Rocko Bishop
 * Checks whether the runtime can format dates in a timezone, so that bad upstream metadata can be
 * rejected before aggregation.
 */
export function isSupportedTimeZone(timeZone: string): boolean {
  try {
    getDayFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function toExchangeDayKey(epochSeconds: number, timeZone: string): DayKey {
  return toDayKey(new Date(epochSeconds * 1000), timeZone);
}

/**
 * Rocko Bishop
 * Formats an instant as the calendar day observed in a timezone. Using formatToParts keeps this
 * independent of locale-specific date ordering.
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

function findPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const part = parts.find((candidate) => candidate.type === type);
  if (!part) {
    throw new Error(`Date formatter did not produce a "${type}" part`);
  }
  return part.value;
}
