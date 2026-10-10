import type { DayKey } from '../types.js';

const MS_PER_DAY = 86_400_000;

/**
 * Rocko Bishop
 * Moves a calendar day forward or back. The arithmetic is done in UTC on purpose: a day key is a
 * timezone-free calendar date, so DST transitions must not affect it.
 */
export function shiftDayKey(dayKey: DayKey, days: number): DayKey {
  const shifted = new Date(Date.parse(`${dayKey}T00:00:00Z`) + days * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}
