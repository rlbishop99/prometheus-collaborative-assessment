import type { DayKey } from '../types.js';
import { shiftDayKey } from './calendarDay.js';
import { toDayKey } from './exchangeDay.js';

const SECONDS_PER_DAY = 86_400;

/** Absolute time range to request from a provider, in epoch seconds. */
export interface FetchRange {
  readonly fromEpochSeconds: number;
  readonly toEpochSeconds: number;
}

/**
 * Rocko Bishop
 * Computes the range to request upstream. It is deliberately wider than the window by
 * `bufferDays`, because the exchange timezone is only known once the response arrives. Bars are
 * trimmed to the exact window afterwards with {@link computeWindowStartDayKey}.
 */
export function computeFetchRange(now: Date, windowDays: number, bufferDays: number): FetchRange {
  const toEpochSeconds = Math.floor(now.getTime() / 1000);
  const fromEpochSeconds = toEpochSeconds - (windowDays + bufferDays) * SECONDS_PER_DAY;
  return { fromEpochSeconds, toEpochSeconds };
}

/**
 * Rocko Bishop
 * Finds the first day included in the rolling window: midnight in the exchange timezone,
 * `windowDays` calendar days before today. Today (the in-progress day) is always included.
 */
export function computeWindowStartDayKey(now: Date, timeZone: string, windowDays: number): DayKey {
  return shiftDayKey(toDayKey(now, timeZone), -windowDays);
}
