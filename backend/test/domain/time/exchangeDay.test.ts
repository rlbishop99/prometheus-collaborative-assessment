import { describe, expect, it } from 'vitest';

import {
  isSupportedTimeZone,
  toDayKey,
  toExchangeDayKey,
} from '../../../src/domain/time/exchangeDay.js';

const NEW_YORK = 'America/New_York';
const toEpochSeconds = (iso: string): number => Date.parse(iso) / 1000;

describe('toExchangeDayKey', () => {
  it('uses the exchange day, not the UTC day, near UTC midnight', () => {
    // 02:00 UTC on Oct 10 is still 22:00 on Oct 9 in New York (EDT, UTC-4).
    expect(toExchangeDayKey(toEpochSeconds('2026-10-10T02:00:00Z'), NEW_YORK)).toBe('2026-10-09');
  });

  it('respects daylight saving time offsets', () => {
    // EST (UTC-5) in January: 04:30 UTC is 23:30 the previous day.
    expect(toExchangeDayKey(toEpochSeconds('2026-01-15T04:30:00Z'), NEW_YORK)).toBe('2026-01-14');
    // EDT (UTC-4) in July: 04:30 UTC is 00:30 the same day.
    expect(toExchangeDayKey(toEpochSeconds('2026-07-15T04:30:00Z'), NEW_YORK)).toBe('2026-07-15');
  });

  it('handles the day DST begins', () => {
    // 2026-03-08: clocks jump 02:00 -> 03:00 in New York.
    expect(toExchangeDayKey(toEpochSeconds('2026-03-08T07:30:00Z'), NEW_YORK)).toBe('2026-03-08');
    expect(toExchangeDayKey(toEpochSeconds('2026-03-08T04:59:00Z'), NEW_YORK)).toBe('2026-03-07');
  });

  it('works for other exchange timezones', () => {
    expect(toExchangeDayKey(toEpochSeconds('2026-10-09T16:00:00Z'), 'Asia/Tokyo')).toBe(
      '2026-10-10',
    );
  });

  it('rejects non-finite timestamps', () => {
    expect(() => toExchangeDayKey(Number.NaN, NEW_YORK)).toThrow(RangeError);
  });

  it('rejects unknown timezones', () => {
    expect(() => toDayKey(new Date(), 'Mars/Olympus_Mons')).toThrow(RangeError);
  });
});

describe('isSupportedTimeZone', () => {
  it('accepts IANA zones and rejects unknown ones', () => {
    expect(isSupportedTimeZone(NEW_YORK)).toBe(true);
    expect(isSupportedTimeZone('Mars/Olympus_Mons')).toBe(false);
  });
});
