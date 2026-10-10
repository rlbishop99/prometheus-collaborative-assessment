import type { DayKey } from '../types.js';

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/**
 * Rocko Bishop
 * Validates that a string is a real calendar date in `YYYY-MM-DD` form. The round-trip check
 * rejects impossible dates such as `2026-02-30` that the regex alone would accept.
 * @param value - The candidate day key.
 * @returns True when `value` is a valid day key.
 */
export function isDayKey(value: string): boolean {
  const match = DAY_KEY_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Rocko Bishop
 * Moves a calendar day forward or back. The arithmetic is done in UTC on purpose: a day key is a
 * timezone-free calendar date, so DST transitions must not affect it.
 * @param dayKey - The starting day as `YYYY-MM-DD`.
 * @param days - Whole days to move; negative moves back.
 * @returns The shifted day as `YYYY-MM-DD`.
 */
export function shiftDayKey(dayKey: DayKey, days: number): DayKey {
  if (!isDayKey(dayKey)) {
    throw new RangeError(`Invalid day key: ${dayKey}`);
  }
  if (!Number.isInteger(days)) {
    throw new RangeError(`days must be an integer, received ${days}`);
  }
  const shifted = new Date(Date.parse(`${dayKey}T00:00:00Z`) + days * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}
