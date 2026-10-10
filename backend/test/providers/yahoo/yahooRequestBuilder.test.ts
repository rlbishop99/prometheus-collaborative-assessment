import { describe, expect, it } from 'vitest';

import { buildYahooChartUrl } from '../../../src/providers/yahoo/yahooRequestBuilder.js';

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const range = { fromEpochSeconds: 1_788_000_000, toEpochSeconds: 1_790_764_800 };

describe('buildYahooChartUrl', () => {
  it('requests 15m bars for the explicit range, excluding extended hours', () => {
    const url = new URL(buildYahooChartUrl(BASE, 'TSLA', range));

    expect(url.origin + url.pathname).toBe(`${BASE}/TSLA`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      interval: '15m',
      period1: '1788000000',
      period2: '1790764800',
      includePrePost: 'false',
    });
  });

  it('percent-encodes special symbol characters', () => {
    expect(buildYahooChartUrl(BASE, '^GSPC', range)).toContain('/chart/%5EGSPC?');
    expect(buildYahooChartUrl(BASE, 'BRK.B', range)).toContain('/chart/BRK.B?');
  });

  it('tolerates a trailing slash on the base URL', () => {
    expect(buildYahooChartUrl(`${BASE}/`, 'TSLA', range)).toContain('/chart/TSLA?');
  });
});
