import { describe, expect, it, vi } from 'vitest';

import type { FetchRange } from '../../src/domain/time/tradingWindow.js';
import type { IntradayBar, IntradaySeries } from '../../src/domain/types.js';
import {
  InvalidSymbolError,
  SymbolNotFoundError,
  UpstreamUnavailableError,
} from '../../src/errors/appErrors.js';
import type { Cache } from '../../src/infra/cache/cache.js';
import { InFlightDeduper } from '../../src/infra/cache/inFlightDeduper.js';
import { InMemoryTtlCache } from '../../src/infra/cache/inMemoryTtlCache.js';
import type { Logger } from '../../src/infra/logging/logger.js';
import type { MarketDataProvider } from '../../src/providers/marketDataProvider.js';
import { DailySummaryService } from '../../src/services/dailySummaryService.js';
import type { DailySummaries } from '../../src/services/dailySummaryService.js';
import { manualClock } from '../support/clock.js';

const TWO_MINUTES = 120_000;
const config = { windowDays: 30, fetchBufferDays: 2 };

const bar = (iso: string, low: number, high: number, volume: number): IntradayBar => ({
  timestamp: Date.parse(iso) / 1000,
  low,
  high,
  volume,
});

const tslaSeries: IntradaySeries = {
  symbol: 'TSLA',
  timeZone: 'America/New_York',
  bars: [
    bar('2026-09-01T14:00:00Z', 1, 2, 1), // before the window: dropped
    bar('2026-10-08T13:30:00Z', 10, 12, 100),
    bar('2026-10-09T13:30:00Z', 20, 22, 200),
    bar('2026-10-09T13:45:00Z', 21, 23, 300),
  ],
};

/** Declared with a property (not a method) so assertions can reference the mock unbound. */
interface ProviderMock {
  readonly getIntradaySeries: ReturnType<typeof vi.fn<MarketDataProvider['getIntradaySeries']>>;
}

const providerReturning = (series: IntradaySeries = tslaSeries): ProviderMock => ({
  getIntradaySeries: vi.fn<MarketDataProvider['getIntradaySeries']>(() => Promise.resolve(series)),
});

const createService = (
  overrides: {
    provider?: ProviderMock;
    cache?: Cache<string, DailySummaries>;
    logger?: Logger;
  } = {},
): { service: DailySummaryService; provider: ProviderMock; advance: (ms: number) => void } => {
  const { clock, advance } = manualClock('2026-10-09T18:00:00Z');
  const provider = overrides.provider ?? providerReturning();
  const service = new DailySummaryService(config, {
    provider,
    cache: overrides.cache ?? new InMemoryTtlCache({ ttlMs: TWO_MINUTES, maxEntries: 100, clock }),
    deduper: new InFlightDeduper(),
    clock,
    logger: overrides.logger ?? { warn: vi.fn() },
  });
  return { service, provider, advance };
};

describe('DailySummaryService', () => {
  it('fetches, trims to the exchange-local window, aggregates and sorts', async () => {
    const { service } = createService();

    expect(await service.getDailySummaries('TSLA')).toEqual([
      { day: '2026-10-08', lowAverage: 10, highAverage: 12, volume: 100 },
      { day: '2026-10-09', lowAverage: 20.5, highAverage: 22.5, volume: 500 },
    ]);
  });

  it('requests the window plus the buffer, ending now', async () => {
    const { service, provider } = createService();

    await service.getDailySummaries('TSLA');

    const [symbol, range] = provider.getIntradaySeries.mock.calls[0] as [string, FetchRange];
    expect(symbol).toBe('TSLA');
    expect(range.toEpochSeconds).toBe(Date.parse('2026-10-09T18:00:00Z') / 1000);
    expect(range.toEpochSeconds - range.fromEpochSeconds).toBe(32 * 86_400);
  });

  it('serves repeat requests from the cache within 2 minutes', async () => {
    const { service, provider, advance } = createService();

    await service.getDailySummaries('TSLA');
    advance(TWO_MINUTES - 1);
    await service.getDailySummaries('TSLA');

    expect(provider.getIntradaySeries).toHaveBeenCalledTimes(1);
  });

  it('re-queries the provider once 2 minutes have elapsed', async () => {
    const { service, provider, advance } = createService();

    await service.getDailySummaries('TSLA');
    advance(TWO_MINUTES);
    await service.getDailySummaries('TSLA');

    expect(provider.getIntradaySeries).toHaveBeenCalledTimes(2);
  });

  it('shares one cache entry across casing and whitespace variants', async () => {
    const { service, provider } = createService();

    await service.getDailySummaries('tsla');
    await service.getDailySummaries('  TSLA ');

    expect(provider.getIntradaySeries).toHaveBeenCalledTimes(1);
    expect(provider.getIntradaySeries).toHaveBeenCalledWith('TSLA', expect.anything());
  });

  it('coalesces concurrent cold requests into one provider call', async () => {
    const { service, provider } = createService();

    const results = await Promise.all([
      service.getDailySummaries('TSLA'),
      service.getDailySummaries('TSLA'),
      service.getDailySummaries('tsla'),
    ]);

    expect(provider.getIntradaySeries).toHaveBeenCalledTimes(1);
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
  });

  it('rejects invalid symbols before touching the cache or the provider', async () => {
    const { service, provider } = createService();

    await expect(service.getDailySummaries('bad symbol!')).rejects.toThrow(InvalidSymbolError);
    expect(provider.getIntradaySeries).not.toHaveBeenCalled();
  });

  it('propagates provider errors without caching them', async () => {
    const provider = providerReturning();
    provider.getIntradaySeries
      .mockRejectedValueOnce(new UpstreamUnavailableError('down'))
      .mockRejectedValueOnce(new SymbolNotFoundError('nope'));
    const { service } = createService({ provider });

    await expect(service.getDailySummaries('TSLA')).rejects.toThrow(UpstreamUnavailableError);
    await expect(service.getDailySummaries('TSLA')).rejects.toThrow(SymbolNotFoundError);
    await expect(service.getDailySummaries('TSLA')).resolves.toHaveLength(2);
    expect(provider.getIntradaySeries).toHaveBeenCalledTimes(3);
  });

  it('returns an empty list for a valid symbol with no trades in the window', async () => {
    const { service } = createService({
      provider: providerReturning({ ...tslaSeries, bars: [] }),
    });

    expect(await service.getDailySummaries('TSLA')).toEqual([]);
  });

  it('returns frozen results so cached data cannot be mutated by a caller', async () => {
    const { service } = createService();

    const summaries = await service.getDailySummaries('TSLA');

    expect(Object.isFrozen(summaries)).toBe(true);
    expect(Object.isFrozen(summaries[0])).toBe(true);
  });

  it('falls back to the provider and logs when the cache read fails', async () => {
    const logger = { warn: vi.fn() };
    const brokenCache: Cache<string, DailySummaries> = {
      get: () => Promise.reject(new Error('cache offline')),
      set: () => Promise.resolve(),
    };
    const { service, provider } = createService({ cache: brokenCache, logger });

    await expect(service.getDailySummaries('TSLA')).resolves.toHaveLength(2);
    expect(provider.getIntradaySeries).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'TSLA' }),
      expect.stringContaining('Cache read failed'),
    );
  });

  it('still returns fresh data and logs when the cache write fails', async () => {
    const logger = { warn: vi.fn() };
    const brokenCache: Cache<string, DailySummaries> = {
      get: () => Promise.resolve(undefined),
      set: () => Promise.reject(new Error('cache full')),
    };
    const { service } = createService({ cache: brokenCache, logger });

    await expect(service.getDailySummaries('TSLA')).resolves.toHaveLength(2);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'TSLA' }),
      expect.stringContaining('Cache write failed'),
    );
  });
});
