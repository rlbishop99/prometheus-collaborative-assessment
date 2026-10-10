import type { DayKey } from './types';

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A day key's numeric parts; month is 1-based. */
export interface DayParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function parseDayKey(dayKey: DayKey): DayParts {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) {
    throw new RangeError(`Invalid day key: ${dayKey}`);
  }
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  return { year, month, day };
}

/**
 * Rocko Bishop
 * Converts a day key into a Date at local midnight, which is what the calendar widget works in.
 * Building it from parts (never `new Date("YYYY-MM-DD")`, which parses as UTC) keeps the day from
 * shifting in timezones west of UTC.
 */
export function dayKeyToLocalDate(dayKey: DayKey): Date {
  const { year, month, day } = parseDayKey(dayKey);
  return new Date(year, month - 1, day);
}

/**
 * Rocko Bishop
 * Converts a calendar-widget Date back into a day key, using local components so the round trip
 * with {@link dayKeyToLocalDate} is exact.
 */
export function localDateToDayKey(date: Date): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
