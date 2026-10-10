import type { FetchRange } from '../domain/time/tradingWindow.js';
import type { IntradaySeries } from '../domain/types.js';

/**
 * Source of intraday bars. The service depends only on this abstraction, so Yahoo can be swapped
 * for another vendor (or a fake in tests) without touching aggregation or HTTP code.
 *
 * Implementations must throw `SymbolNotFoundError`, `UpstreamUnavailableError` or
 * `UpstreamResponseError` for the corresponding failures.
 */
export interface MarketDataProvider {
  getIntradaySeries(symbol: string, range: FetchRange): Promise<IntradaySeries>;
}
