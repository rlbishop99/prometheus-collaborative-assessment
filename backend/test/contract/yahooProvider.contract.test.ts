/*
 * Contract test against the real Yahoo Finance API.
 *
 * It runs live whenever Yahoo is reachable, so drift in Yahoo's payload is caught early. If Yahoo
 * is unreachable (network down, rate limited, outage), the same assertions run against the canned
 * capture in test/fixtures instead, so the suite stays green offline. Only *unreachability* falls
 * back: a reachable Yahoo returning an unexpected shape must fail this test, because that drift
 * is exactly what the test exists to detect.
 *
 * Set CONTRACT_YAHOO_BASE_URL to point elsewhere; e.g. `http://127.0.0.1:9` forces the fallback.
 */
import { describe, expect, it } from 'vitest';

import { buildDailySummaries } from '../../src/domain/aggregation/buildDailySummaries.js';
import {
  computeFetchRange,
  computeWindowStartDayKey,
} from '../../src/domain/time/tradingWindow.js';
import type { IntradaySeries } from '../../src/domain/types.js';
import { UpstreamUnavailableError } from '../../src/errors/appErrors.js';
import { YahooChartProvider } from '../../src/providers/yahoo/yahooChartProvider.js';
import { instantDeps, jsonResponse, loadYahooFixture, testYahooConfig } from '../support/http.js';

const SYMBOL = 'TSLA';
const WINDOW_DAYS = 30;

interface ContractSample {
  readonly source: 'live' | 'fixture';
  readonly series: IntradaySeries;
  readonly now: Date;
}

const loadSample = async (): Promise<ContractSample> => {
  const now = new Date();
  const range = computeFetchRange(now, WINDOW_DAYS, 2);
  try {
    const live = new YahooChartProvider({
      ...testYahooConfig,
      baseUrl: process.env.CONTRACT_YAHOO_BASE_URL ?? testYahooConfig.baseUrl,
      retryPolicy: { maxRetries: 1, baseDelayMs: 250, maxDelayMs: 1_000 },
    });
    const series = await live.getIntradaySeries(SYMBOL, range);
    console.info(`[contract] Using live Yahoo response (${series.bars.length} bars).`);
    return { source: 'live', series, now };
  } catch (error) {
    if (!(error instanceof UpstreamUnavailableError)) {
      throw error;
    }
    console.warn(`[contract] Yahoo unreachable (${error.message}); using canned fixture.`);
    const canned = new YahooChartProvider(
      testYahooConfig,
      instantDeps(() => Promise.resolve(jsonResponse(loadYahooFixture('tsla-15m')))),
    );
    const series = await canned.getIntradaySeries(SYMBOL, range);
    const lastBar = series.bars.at(-1);
    // Evaluate the window relative to when the fixture was captured, not today.
    return { source: 'fixture', series, now: new Date((lastBar?.timestamp ?? 0) * 1000) };
  }
};

describe('Yahoo chart provider contract', () => {
  it('returns a well-formed 15-minute series that aggregates into the API contract', async () => {
    const { source, series, now } = await loadSample();

    expect(series.symbol).toBe(SYMBOL);
    expect(series.timeZone).toBe('America/New_York');
    expect(series.bars.length).toBeGreaterThan(100);

    const timestamps = series.bars.map((bar) => bar.timestamp);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
    expect(timestamps.every(isQuarterHour)).toBe(true);

    const windowStart = computeWindowStartDayKey(now, series.timeZone, WINDOW_DAYS);
    const summaries = buildDailySummaries(series, windowStart);

    expect(summaries.length, `source=${source}`).toBeGreaterThanOrEqual(15);
    for (const summary of summaries) {
      expect(summary.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(summary.day >= windowStart).toBe(true);
      expect(hasAtMostFourDecimals(summary.lowAverage)).toBe(true);
      expect(hasAtMostFourDecimals(summary.highAverage)).toBe(true);
      expect(summary.lowAverage).toBeLessThanOrEqual(summary.highAverage);
      expect(Number.isSafeInteger(summary.volume)).toBe(true);
    }
  }, 30_000);
});

function isQuarterHour(epochSeconds: number): boolean {
  return epochSeconds % 900 === 0;
}

function hasAtMostFourDecimals(value: number): boolean {
  return Number(value.toFixed(4)) === value;
}
