import type { FetchRange } from '../../domain/time/tradingWindow.js';

/** Fixed by the assessment: 15-minute intraday bars. */
const YAHOO_INTERVAL = '15m';

/**
 * Rocko Bishop
 * Builds the Yahoo chart URL for a symbol and time range. Yahoo's default range for 15m bars is a
 * single day, so `period1`/`period2` must always be sent explicitly. Extended hours are excluded
 * explicitly as well, rather than relying on Yahoo's default.
 */
export function buildYahooChartUrl(baseUrl: string, symbol: string, range: FetchRange): string {
  const url = new URL(`${trimTrailingSlash(baseUrl)}/${encodeURIComponent(symbol)}`);
  url.searchParams.set('interval', YAHOO_INTERVAL);
  url.searchParams.set('period1', String(range.fromEpochSeconds));
  url.searchParams.set('period2', String(range.toEpochSeconds));
  url.searchParams.set('includePrePost', 'false');
  return url.toString();
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
