import { describe, expect, it } from 'vitest';

import { isDayKey, shiftDayKey } from '../../../src/domain/time/calendarDay.js';

describe('isDayKey', () => {
  it.each(['2026-10-10', '2024-02-29'])('accepts the real date %s', (value) => {
    expect(isDayKey(value)).toBe(true);
  });

  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-1-01', '20261010', ''])(
    'rejects %s',
    (value) => {
      expect(isDayKey(value)).toBe(false);
    },
  );
});

describe('shiftDayKey', () => {
  it('moves back across month and year boundaries', () => {
    expect(shiftDayKey('2026-10-10', -30)).toBe('2026-09-10');
    expect(shiftDayKey('2026-01-15', -30)).toBe('2025-12-16');
  });

  it('is unaffected by DST transitions', () => {
    expect(shiftDayKey('2026-03-09', -1)).toBe('2026-03-08');
    expect(shiftDayKey('2026-11-02', -1)).toBe('2026-11-01');
  });

  it('handles leap days', () => {
    expect(shiftDayKey('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('rejects invalid input', () => {
    expect(() => shiftDayKey('not-a-day', 1)).toThrow(RangeError);
    expect(() => shiftDayKey('2026-10-10', 1.5)).toThrow(RangeError);
  });
});
