import { describe, expect, it } from 'vitest';

import {
  SymbolNotFoundError,
  UpstreamResponseError,
  UpstreamUnavailableError,
} from '../../../src/errors/appErrors.js';
import { YahooChartProvider } from '../../../src/providers/yahoo/yahooChartProvider.js';
import {
  instantDeps,
  jsonResponse,
  loadYahooFixture,
  sequencedFetch,
  testYahooConfig,
  textResponse,
} from '../../support/http.js';

const range = { fromEpochSeconds: 1_788_000_000, toEpochSeconds: 1_790_764_800 };

const providerReturning = (
  ...outcomes: (Response | Error)[]
): { provider: YahooChartProvider; fetchFn: ReturnType<typeof sequencedFetch> } => {
  const fetchFn = sequencedFetch(...outcomes);
  return { provider: new YahooChartProvider(testYahooConfig, instantDeps(fetchFn)), fetchFn };
};

describe('YahooChartProvider', () => {
  it('returns the mapped series for a successful response', async () => {
    const { provider } = providerReturning(jsonResponse(loadYahooFixture('tsla-15m')));

    const series = await provider.getIntradaySeries('TSLA', range);

    expect(series.timeZone).toBe('America/New_York');
    expect(series.bars.length).toBeGreaterThan(500);
  });

  it('sends the configured User-Agent to the built URL', async () => {
    const { provider, fetchFn } = providerReturning(jsonResponse(loadYahooFixture('tsla-15m')));

    await provider.getIntradaySeries('TSLA', range);

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toEqual(expect.stringContaining('/chart/TSLA?interval=15m&period1=1788000000'));
    expect(init?.headers).toMatchObject({ 'User-Agent': testYahooConfig.userAgent });
  });

  it('maps a genuine Yahoo 404 to SymbolNotFoundError without retrying', async () => {
    const { provider, fetchFn } = providerReturning(
      jsonResponse(loadYahooFixture('not-found'), 404),
    );

    await expect(provider.getIntradaySeries('ZZZZNOTREAL', range)).rejects.toThrow(
      SymbolNotFoundError,
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('does not report a 404 without a Yahoo error body as an unknown symbol', async () => {
    const { provider } = providerReturning(textResponse('<html>Not Found</html>', 404));

    await expect(provider.getIntradaySeries('TSLA', range)).rejects.toThrow(UpstreamResponseError);
  });

  it('maps exhausted transient statuses to UpstreamUnavailableError', async () => {
    const { provider, fetchFn } = providerReturning(
      textResponse('', 503),
      textResponse('', 503),
      textResponse('', 503),
    );

    await expect(provider.getIntradaySeries('TSLA', range)).rejects.toThrow(
      UpstreamUnavailableError,
    );
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('maps transport failures to UpstreamUnavailableError', async () => {
    const failure = new TypeError('fetch failed');
    const { provider } = providerReturning(failure, failure, failure);

    await expect(provider.getIntradaySeries('TSLA', range)).rejects.toThrow(
      UpstreamUnavailableError,
    );
  });

  it('maps other non-success statuses to UpstreamResponseError', async () => {
    const { provider } = providerReturning(textResponse('forbidden', 403));

    await expect(provider.getIntradaySeries('TSLA', range)).rejects.toThrow(UpstreamResponseError);
  });

  it('maps a non-JSON success body to UpstreamResponseError', async () => {
    const { provider } = providerReturning(textResponse('<html>oops</html>', 200));

    await expect(provider.getIntradaySeries('TSLA', range)).rejects.toThrow(UpstreamResponseError);
  });

  it('maps schema drift to UpstreamResponseError naming the offending field', async () => {
    const drifted = { chart: { result: [{ meta: { symbol: 'TSLA' }, indicators: {} }] } };
    const { provider } = providerReturning(jsonResponse(drifted));

    await expect(provider.getIntradaySeries('TSLA', range)).rejects.toThrow(/exchangeTimezoneName/);
  });
});
