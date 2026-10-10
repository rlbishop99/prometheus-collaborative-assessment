import type { FetchRange } from '../../domain/time/tradingWindow.js';

/** Fixed by the assessment: 15-minute intraday bars. */
export const YAHOO_INTERVAL = '15m';

/**
 * Rocko Bishop
 * Builds the Yahoo chart URL for a symbol and time range. Yahoo's default range for 15m bars is a
 * single day, so `period1`/`period2` must always be sent explicitly. Extended hours are excluded
 * explicitly as well, rather than relying on Yahoo's default.
 * @param baseUrl - Chart endpoint base, e.g. `https://query1.finance.yahoo.com/v8/finance/chart`.
 * @param symbol - Already validated, upper-cased ticker.
 * @param range - Epoch-second range to request.
 * @returns The fully encoded request URL.
 */
export function buildYahooChartUrl(baseUrl: string, symbol: string, range: FetchRange): string {
  const url = new URL(`${trimTrailingSlash(baseUrl)}/${encodeURIComponent(symbol)}`);
  url.searchParams.set('interval', YAHOO_INTERVAL);
  url.searchParams.set('period1', String(range.fromEpochSeconds));
  url.searchParams.set('period2', String(range.toEpochSeconds));
  url.searchParams.set('includePrePost', 'false');
  return url.toString();
}

/**
 * Rocko Bishop
 * Removes trailing slashes so that a configured base URL with or without one produces the same
 * path.
 * @param value - The base URL.
 * @returns The base URL without trailing slashes.
 */
function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
