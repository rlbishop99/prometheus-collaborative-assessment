import { describe, expect, it } from 'vitest';

import { buildDailySummaries } from '../../../src/domain/aggregation/buildDailySummaries.js';
import type { IntradayBar, IntradaySeries } from '../../../src/domain/types.js';

const NEW_YORK = 'America/New_York';

const bar = (
  iso: string,
  low: number | null,
  high: number | null,
  volume: number | null,
): IntradayBar => ({ timestamp: Date.parse(iso) / 1000, low, high, volume });

const series = (bars: IntradayBar[]): IntradaySeries => ({
  symbol: 'TSLA',
  timeZone: NEW_YORK,
  bars,
});

describe('buildDailySummaries', () => {
  it('groups by exchange day and sorts ascending', () => {
    const result = buildDailySummaries(
      series([
        bar('2026-10-09T13:30:00Z', 20, 22, 10),
        bar('2026-10-08T13:30:00Z', 10, 12, 5),
        bar('2026-10-09T19:45:00Z', 21, 23, 20),
      ]),
      '2026-09-09',
    );
    expect(result).toEqual([
      { day: '2026-10-08', lowAverage: 10, highAverage: 12, volume: 5 },
      { day: '2026-10-09', lowAverage: 20.5, highAverage: 22.5, volume: 30 },
    ]);
  });

  it('excludes null bars from the averages and the volume', () => {
    const result = buildDailySummaries(
      series([
        bar('2026-10-09T13:30:00Z', 10, 12, 100),
        bar('2026-10-09T13:45:00Z', null, null, null),
        bar('2026-10-09T14:00:00Z', 14, 16, 300),
      ]),
      '2026-09-09',
    );
    expect(result).toEqual([{ day: '2026-10-09', lowAverage: 12, highAverage: 14, volume: 400 }]);
  });

  it('omits days whose bars are all invalid', () => {
    const result = buildDailySummaries(
      series([bar('2026-10-09T13:30:00Z', null, 12, 100)]),
      '2026-09-09',
    );
    expect(result).toEqual([]);
  });

  it('drops days before the window start and keeps the start day itself', () => {
    const result = buildDailySummaries(
      series([bar('2026-09-08T13:30:00Z', 1, 2, 1), bar('2026-09-09T13:30:00Z', 3, 4, 1)]),
      '2026-09-09',
    );
    expect(result.map((summary) => summary.day)).toEqual(['2026-09-09']);
  });

  it('returns an empty list for an empty series', () => {
    expect(buildDailySummaries(series([]), '2026-09-09')).toEqual([]);
  });
});
