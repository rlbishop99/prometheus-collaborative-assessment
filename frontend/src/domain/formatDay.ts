import { parseDayKey } from './dayKey';
import type { DayKey } from './types';

const LOCALE = 'en-US';

/** Formatters are costly to construct, so they are built once. */
const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' });
const ordinalRules = new Intl.PluralRules(LOCALE, { type: 'ordinal' });

const ORDINAL_SUFFIXES: Readonly<Record<Intl.LDMLPluralRule, string>> = {
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
};

/**
 * Rocko Bishop
 * Formats a day key as `Jan 1st, 1999`. The month name is taken in UTC from a UTC-built date, so
 * no local timezone can move the day; no time or timezone is ever shown.
 * @param dayKey - The day as `YYYY-MM-DD`.
 * @returns The display string.
 */
export function formatDay(dayKey: DayKey): string {
  return `${formatMonthDay(dayKey)}, ${parseDayKey(dayKey).year}`;
}

/**
 * Rocko Bishop
 * Formats a day key without the year, e.g. `Oct 9th`, for compact references within the 30-day
 * window (the full date is shown in the Day cell).
 * @param dayKey - The day as `YYYY-MM-DD`.
 * @returns The display string.
 */
export function formatMonthDay(dayKey: DayKey): string {
  const { year, month, day } = parseDayKey(dayKey);
  const monthName = monthFormatter.format(new Date(Date.UTC(year, month - 1, day)));
  return `${monthName} ${withOrdinal(day)}`;
}

/**
 * Rocko Bishop
 * Adds the English ordinal suffix (1st, 2nd, 3rd, 4th, 11th, 21st, ...). Intl has no ordinal
 * formatter, but PluralRules classifies the number correctly, including the 11th-13th exceptions.
 * @param day - Day of the month.
 * @returns The day with its suffix.
 */
export function withOrdinal(day: number): string {
  return `${day}${ORDINAL_SUFFIXES[ordinalRules.select(day)]}`;
}
