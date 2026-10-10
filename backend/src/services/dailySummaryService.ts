import { buildDailySummaries } from '../domain/aggregation/buildDailySummaries.js';
import { parseSymbol } from '../domain/symbol.js';
import { computeFetchRange, computeWindowStartDayKey } from '../domain/time/tradingWindow.js';
import type { DailySummary } from '../domain/types.js';
import type { Cache } from '../infra/cache/cache.js';
import type { InFlightDeduper } from '../infra/cache/inFlightDeduper.js';
import type { Clock } from '../infra/clock.js';
import type { Logger } from '../infra/logging/logger.js';
import type { MarketDataProvider } from '../providers/marketDataProvider.js';

export type DailySummaries = readonly DailySummary[];

export interface DailySummaryServiceConfig {
  /** Rolling window length in calendar days. */
  readonly windowDays: number;
  /** Extra days fetched upstream before trimming to the exact exchange-local window. */
  readonly fetchBufferDays: number;
}

export interface DailySummaryServiceDeps {
  readonly provider: MarketDataProvider;
  readonly cache: Cache<string, DailySummaries>;
  readonly deduper: InFlightDeduper<string, DailySummaries>;
  readonly clock: Clock;
  readonly logger: Logger;
}

/**
 * Use case: "give me the daily summaries for a symbol". It orchestrates normalization, the cache,
 * request coalescing, the provider and aggregation, and owns none of their logic itself.
 */
export class DailySummaryService {
  /**
   * Rocko Bishop
   * Creates the service from its collaborators; every dependency is an abstraction or a value.
   * @param config - Window sizing.
   * @param deps - Provider, cache, deduper, clock and logger.
   */
  constructor(
    private readonly config: DailySummaryServiceConfig,
    private readonly deps: DailySummaryServiceDeps,
  ) {}

  /**
   * Rocko Bishop
   * Returns the summaries for a symbol from the cache when fresh. Otherwise it fetches them, with
   * concurrent identical requests sharing one upstream call. Only successful results are cached.
   * @param rawSymbol - Untrusted symbol input; normalized and validated here.
   * @returns Frozen per-day summaries, ascending by day.
   */
  async getDailySummaries(rawSymbol: unknown): Promise<DailySummaries> {
    const symbol = parseSymbol(rawSymbol);
    const cached = await this.readCache(symbol);
    if (cached) {
      return cached;
    }
    return this.deps.deduper.run(symbol, () => this.fetchAndCache(symbol));
  }

  /**
   * Rocko Bishop
   * Fetches upstream, aggregates and stores the result. The window is anchored to a single `now`,
   * so the fetch range and the trim boundary always agree.
   * @param symbol - Normalized symbol.
   * @returns Frozen per-day summaries.
   */
  private async fetchAndCache(symbol: string): Promise<DailySummaries> {
    const now = new Date(this.deps.clock());
    const range = computeFetchRange(now, this.config.windowDays, this.config.fetchBufferDays);
    const series = await this.deps.provider.getIntradaySeries(symbol, range);
    const windowStart = computeWindowStartDayKey(now, series.timeZone, this.config.windowDays);
    const summaries = freezeSummaries(buildDailySummaries(series, windowStart));
    await this.writeCache(symbol, summaries);
    return summaries;
  }

  /**
   * Rocko Bishop
   * Reads the cache. The cache is an optimization, so a failure is logged and treated as a miss
   * rather than failing the request.
   * @param symbol - Normalized symbol.
   * @returns The cached summaries, or undefined on a miss or a cache failure.
   */
  private async readCache(symbol: string): Promise<DailySummaries | undefined> {
    try {
      return await this.deps.cache.get(symbol);
    } catch (error) {
      this.deps.logger.warn({ err: error, symbol }, 'Cache read failed; fetching upstream');
      return undefined;
    }
  }

  /**
   * Rocko Bishop
   * Writes the cache. A failure is logged and swallowed, because the caller already has fresh data
   * to return.
   * @param symbol - Normalized symbol.
   * @param summaries - The value to cache.
   */
  private async writeCache(symbol: string, summaries: DailySummaries): Promise<void> {
    try {
      await this.deps.cache.set(symbol, summaries);
    } catch (error) {
      this.deps.logger.warn({ err: error, symbol }, 'Cache write failed; serving uncached result');
    }
  }
}

/**
 * Rocko Bishop
 * Deep-freezes the summaries. The same instance is shared by every caller that hits the cache, so
 * one consumer's mutation must never leak into another's response.
 * @param summaries - Freshly built summaries.
 * @returns The same data, immutable.
 */
function freezeSummaries(summaries: DailySummary[]): DailySummaries {
  return Object.freeze(summaries.map((summary) => Object.freeze({ ...summary })));
}
