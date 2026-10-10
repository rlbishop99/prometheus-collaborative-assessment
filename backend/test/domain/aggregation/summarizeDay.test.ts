import { describe, expect, it } from 'vitest';

import { summarizeDay } from '../../../src/domain/aggregation/summarizeDay.js';
import type { ValidBar } from '../../../src/domain/types.js';

const bar = (low: number, high: number, volume: number): ValidBar => ({
  timestamp: 1_791_552_600,
  low,
  high,
  volume,
});

describe('summarizeDay', () => {
  it('averages lows and highs and sums volume', () => {
    expect(summarizeDay('2026-10-09', [bar(10, 12, 100), bar(11, 15, 250)])).toEqual({
      day: '2026-10-09',
      lowAverage: 10.5,
      highAverage: 13.5,
      volume: 350,
    });
  });

  it('rounds the averages once, at the end, with a ceiling to 4 decimals', () => {
    // Mean low = 10.000033..., which ceils to 10.0001; mean high = 20.
    const bars = [bar(10, 20, 1), bar(10, 20, 1), bar(10.0001, 20, 1)];
    expect(summarizeDay('2026-10-09', bars)).toMatchObject({
      lowAverage: 10.0001,
      highAverage: 20,
    });
  });
});
