import { describe, expect, it } from 'vitest';

import {
  computeFetchRange,
  computeWindowStartDayKey,
} from '../../../src/domain/time/tradingWindow.js';

const NEW_YORK = 'America/New_York';

describe('computeFetchRange', () => {
  it('spans the window plus the buffer, ending now', () => {
    const now = new Date('2026-10-10T15:00:00Z');
    const range = computeFetchRange(now, 30, 2);
    expect(range.toEpochSeconds).toBe(Date.parse('2026-10-10T15:00:00Z') / 1000);
    expect(range.toEpochSeconds - range.fromEpochSeconds).toBe(32 * 86_400);
  });

  it('rejects negative or fractional day counts', () => {
    const now = new Date();
    expect(() => computeFetchRange(now, -1, 2)).toThrow(RangeError);
    expect(() => computeFetchRange(now, 30, 0.5)).toThrow(RangeError);
  });
});

describe('computeWindowStartDayKey', () => {
  it('starts 30 calendar days before today in the exchange timezone', () => {
    expect(computeWindowStartDayKey(new Date('2026-10-10T15:00:00Z'), NEW_YORK, 30)).toBe(
      '2026-09-10',
    );
  });

  it('anchors "today" to the exchange day, not the UTC day', () => {
    // 01:00 UTC on Oct 10 is still Oct 9 in New York.
    expect(computeWindowStartDayKey(new Date('2026-10-10T01:00:00Z'), NEW_YORK, 30)).toBe(
      '2026-09-09',
    );
  });

  it('rejects an invalid window size', () => {
    expect(() => computeWindowStartDayKey(new Date(), NEW_YORK, -5)).toThrow(RangeError);
  });
});
