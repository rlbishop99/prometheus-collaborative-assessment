import { describe, expect, it } from 'vitest';

import { SymbolNotFoundError, UpstreamResponseError } from '../../../src/errors/appErrors.js';
import { mapYahooChartResponse } from '../../../src/providers/yahoo/yahooResponseMapper.js';
import { yahooChartResponseSchema } from '../../../src/providers/yahoo/yahooResponseSchema.js';
import type { YahooChartResponse } from '../../../src/providers/yahoo/yahooResponseSchema.js';
import { loadYahooFixture } from '../../support/http.js';
import type { YahooFixture } from '../../support/http.js';

const parseFixture = (name: YahooFixture): YahooChartResponse =>
  yahooChartResponseSchema.parse(loadYahooFixture(name));

const withResult = (result: Record<string, unknown>): YahooChartResponse =>
  yahooChartResponseSchema.parse({ chart: { result: [result], error: null } });

const meta = { symbol: 'TSLA', exchangeTimezoneName: 'America/New_York' };

describe('mapYahooChartResponse', () => {
  it('maps the real TSLA capture into aligned bars', () => {
    const series = mapYahooChartResponse(parseFixture('tsla-15m'), 'TSLA');

    expect(series.symbol).toBe('TSLA');
    expect(series.timeZone).toBe('America/New_York');
    expect(series.bars.length).toBeGreaterThan(500);
    expect(series.bars[0]).toEqual({
      timestamp: expect.any(Number) as number,
      low: expect.any(Number) as number,
      high: expect.any(Number) as number,
      volume: expect.any(Number) as number,
    });
  });

  it('preserves null gaps for the aggregation layer to drop', () => {
    const series = mapYahooChartResponse(parseFixture('with-null-bars'), 'TSLA');

    expect(series.bars[1]).toEqual({
      timestamp: 1_791_553_500,
      low: null,
      high: null,
      volume: null,
    });
    expect(series.bars[3]?.high).toBeNull();
  });

  it('returns no bars for a range without trades (no timestamp, empty quote)', () => {
    expect(mapYahooChartResponse(parseFixture('empty-range'), 'TSLA').bars).toEqual([]);
  });

  it('fills short columns with nulls instead of shifting values', () => {
    const series = mapYahooChartResponse(
      withResult({
        meta,
        timestamp: [1, 2],
        indicators: { quote: [{ low: [10], high: [11, 12], volume: [5, 6] }] },
      }),
      'TSLA',
    );

    expect(series.bars[1]).toEqual({ timestamp: 2, low: null, high: 12, volume: 6 });
  });

  it('treats a missing quote entry as all-null columns', () => {
    const series = mapYahooChartResponse(
      withResult({ meta, timestamp: [1], indicators: { quote: [] } }),
      'TSLA',
    );

    expect(series.bars).toEqual([{ timestamp: 1, low: null, high: null, volume: null }]);
  });

  it('raises SymbolNotFoundError for Yahoo "Not Found"', () => {
    expect(() => mapYahooChartResponse(parseFixture('not-found'), 'ZZZZNOTREAL')).toThrow(
      SymbolNotFoundError,
    );
  });

  it('raises UpstreamResponseError for any other Yahoo error code', () => {
    const payload = yahooChartResponseSchema.parse({
      chart: { result: null, error: { code: 'Bad Request', description: 'Invalid input' } },
    });
    expect(() => mapYahooChartResponse(payload, 'TSLA')).toThrow(UpstreamResponseError);
  });

  it('raises UpstreamResponseError when there is neither a result nor an error', () => {
    const payload = yahooChartResponseSchema.parse({ chart: { result: [], error: null } });
    expect(() => mapYahooChartResponse(payload, 'TSLA')).toThrow(UpstreamResponseError);
  });

  it('raises UpstreamResponseError for an unsupported timezone', () => {
    const payload = withResult({
      meta: { ...meta, exchangeTimezoneName: 'Mars/Olympus_Mons' },
      indicators: { quote: [{}] },
    });
    expect(() => mapYahooChartResponse(payload, 'TSLA')).toThrow(UpstreamResponseError);
  });
});
