import { isSupportedTimeZone } from '../../domain/time/exchangeDay.js';
import type { IntradayBar, IntradaySeries } from '../../domain/types.js';
import { SymbolNotFoundError, UpstreamResponseError } from '../../errors/appErrors.js';
import type {
  YahooChartError,
  YahooChartResponse,
  YahooChartResult,
  YahooQuote,
} from './yahooResponseSchema.js';

const NOT_FOUND_CODE = 'not found';

/**
 * Rocko Bishop
 * Translates a schema-validated Yahoo chart payload into the provider-neutral IntradaySeries.
 * Yahoo-specific error semantics are resolved here, so nothing downstream knows about Yahoo.
 * @param payload - A payload that already passed `yahooChartResponseSchema`.
 * @param requestedSymbol - The symbol that was requested, used in error messages.
 * @returns The symbol's intraday series.
 */
export function mapYahooChartResponse(
  payload: YahooChartResponse,
  requestedSymbol: string,
): IntradaySeries {
  const { result, error } = payload.chart;
  if (error) {
    throw mapChartError(error, requestedSymbol);
  }

  const chart = selectSingleResult(result, requestedSymbol);
  const timeZone = chart.meta.exchangeTimezoneName;
  if (!isSupportedTimeZone(timeZone)) {
    throw new UpstreamResponseError(`Unsupported exchange timezone "${timeZone}"`);
  }

  return {
    symbol: chart.meta.symbol,
    timeZone,
    bars: zipBars(chart.timestamp ?? [], chart.indicators.quote[0] ?? {}),
  };
}

/**
 * Rocko Bishop
 * Converts Yahoo's in-body error object into the matching application error.
 * @param error - The `chart.error` object.
 * @param requestedSymbol - The symbol that was requested.
 * @returns SymbolNotFoundError for "Not Found", otherwise UpstreamResponseError.
 */
function mapChartError(error: YahooChartError, requestedSymbol: string): Error {
  if (error.code.trim().toLowerCase() === NOT_FOUND_CODE) {
    return new SymbolNotFoundError(`No data found for symbol "${requestedSymbol}"`);
  }
  const description = error.description ?? 'no description';
  return new UpstreamResponseError(`Yahoo error ${error.code}: ${description}`);
}

/**
 * Rocko Bishop
 * Picks the single chart result Yahoo returns per symbol, rejecting the "no error but no result"
 * payloads that should never occur.
 * @param result - The `chart.result` array, possibly null or empty.
 * @param requestedSymbol - The symbol that was requested.
 * @returns The first (and only) result.
 */
function selectSingleResult(
  result: readonly YahooChartResult[] | null | undefined,
  requestedSymbol: string,
): YahooChartResult {
  const first = result?.[0];
  if (!first) {
    throw new UpstreamResponseError(`Yahoo returned no result for "${requestedSymbol}"`);
  }
  return first;
}

/**
 * Rocko Bishop
 * Combines Yahoo's column-oriented arrays into row-oriented bars. Yahoo's columns are
 * index-aligned with `timestamp`; if a column is short or missing, the gap becomes null and is
 * filtered out during aggregation instead of shifting data between bars.
 * @param timestamps - Bar start times in epoch seconds.
 * @param quote - The quote columns.
 * @returns One bar per timestamp.
 */
function zipBars(timestamps: readonly number[], quote: YahooQuote): IntradayBar[] {
  return timestamps.map((timestamp, index) => ({
    timestamp,
    low: valueAt(quote.low, index),
    high: valueAt(quote.high, index),
    volume: valueAt(quote.volume, index),
  }));
}

/**
 * Rocko Bishop
 * Reads an optional column at an index and normalizes "missing" to null.
 * @param column - The column, which may be absent.
 * @param index - The row index.
 * @returns The value, or null when the column or the entry is missing.
 */
function valueAt(column: readonly (number | null)[] | undefined, index: number): number | null {
  return column?.[index] ?? null;
}
