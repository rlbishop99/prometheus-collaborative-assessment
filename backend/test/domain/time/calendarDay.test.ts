import { describe, expect, it } from 'vitest';

import { shiftDayKey } from '../../../src/domain/time/calendarDay.js';

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
});
