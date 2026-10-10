import { describe, expect, it } from 'vitest';

import { dayKeyToLocalDate, localDateToDayKey, parseDayKey } from '../../src/domain/dayKey';
import { formatDay, formatMonthDay, withOrdinal } from '../../src/domain/formatDay';
import { formatPrice, formatVolume } from '../../src/domain/formatNumber';

describe('formatDay', () => {
  it.each([
    ['1999-01-01', 'Jan 1st, 1999'],
    ['2026-10-09', 'Oct 9th, 2026'],
    ['2026-09-22', 'Sep 22nd, 2026'],
    ['2026-09-23', 'Sep 23rd, 2026'],
    ['2026-09-11', 'Sep 11th, 2026'],
    ['2026-12-31', 'Dec 31st, 2026'],
  ])('formats %s as %s', (key, expected) => {
    expect(formatDay(key)).toBe(expected);
  });

  it('rejects malformed keys', () => {
    expect(() => formatDay('Oct 9')).toThrow(RangeError);
  });
});

describe('withOrdinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [30, '30th'],
  ])('%d -> %s', (day, expected) => {
    expect(withOrdinal(day)).toBe(expected);
  });
});

describe('number formatting', () => {
  it('shows prices with thousands separators and exactly 4 decimals', () => {
    expect(formatPrice(40.2958)).toBe('40.2958');
    expect(formatPrice(364.918)).toBe('364.9180');
    expect(formatPrice(7591.9493)).toBe('7,591.9493');
    expect(formatPrice(41)).toBe('41.0000');
  });

  it('shows volume with thousands separators', () => {
    expect(formatVolume(49_073_348)).toBe('49,073,348');
    expect(formatVolume(0)).toBe('0');
  });
});

describe('day key conversion', () => {
  it('round-trips through local dates without shifting the day', () => {
    for (const key of ['2026-01-01', '2026-03-08', '2026-10-09', '2026-11-01', '2024-02-29']) {
      expect(localDateToDayKey(dayKeyToLocalDate(key))).toBe(key);
    }
  });

  it('builds local midnight for the calendar widget', () => {
    const date = dayKeyToLocalDate('2026-10-09');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 9, 9, 0,
    ]);
  });

  it('parses parts and rejects malformed keys', () => {
    expect(parseDayKey('2026-10-09')).toEqual({ year: 2026, month: 10, day: 9 });
    expect(() => parseDayKey('2026-1-9')).toThrow(RangeError);
  });
});

describe('formatMonthDay', () => {
  it.each([
    ['2026-10-09', 'Oct 9th'],
    ['2026-09-22', 'Sep 22nd'],
    ['1999-01-01', 'Jan 1st'],
  ])('formats %s as %s', (key, expected) => {
    expect(formatMonthDay(key)).toBe(expected);
  });
});
