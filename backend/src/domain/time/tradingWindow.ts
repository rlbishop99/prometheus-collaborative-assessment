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
 * @param now - The current instant.
 * @param windowDays - Size of the rolling window in calendar days.
 * @param bufferDays - Extra days to fetch beyond the window.
 * @returns The epoch-second range ending at `now`.
 */
export function computeFetchRange(now: Date, windowDays: number, bufferDays: number): FetchRange {
  assertNonNegativeInteger('windowDays', windowDays);
  assertNonNegativeInteger('bufferDays', bufferDays);

  const toEpochSeconds = Math.floor(now.getTime() / 1000);
  const fromEpochSeconds = toEpochSeconds - (windowDays + bufferDays) * SECONDS_PER_DAY;
  return { fromEpochSeconds, toEpochSeconds };
}

/**
 * Rocko Bishop
 * Finds the first day included in the rolling window: midnight in the exchange timezone,
 * `windowDays` calendar days before today. Today (the in-progress day) is always included.
 * @param now - The current instant.
 * @param timeZone - IANA timezone of the exchange.
 * @param windowDays - Size of the rolling window in calendar days.
 * @returns The window's first day as `YYYY-MM-DD`.
 */
export function computeWindowStartDayKey(now: Date, timeZone: string, windowDays: number): DayKey {
  assertNonNegativeInteger('windowDays', windowDays);
  return shiftDayKey(toDayKey(now, timeZone), -windowDays);
}

/**
 * Rocko Bishop
 * Guards day-count arguments, so that a bad config value fails fast rather than producing a wrong
 * window.
 * @param name - Argument name, used in the error message.
 * @param value - The value to check.
 */
function assertNonNegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer, received ${value}`);
  }
}
