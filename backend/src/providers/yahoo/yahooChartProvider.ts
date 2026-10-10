import type { FetchRange } from '../../domain/time/tradingWindow.js';
import type { IntradaySeries } from '../../domain/types.js';
import { UpstreamResponseError, UpstreamUnavailableError } from '../../errors/appErrors.js';
import { defaultFetchWithRetryDeps, fetchWithRetry } from '../../infra/http/fetchWithRetry.js';
import type { FetchWithRetryDeps } from '../../infra/http/fetchWithRetry.js';
import { HttpTransportError } from '../../infra/http/httpTransportError.js';
import { isRetryableStatus } from '../../infra/http/retryPolicy.js';
import type { RetryPolicy } from '../../infra/http/retryPolicy.js';
import type { MarketDataProvider } from '../marketDataProvider.js';
import { buildYahooChartUrl } from './yahooRequestBuilder.js';
import { mapYahooChartResponse } from './yahooResponseMapper.js';
import { yahooChartResponseSchema } from './yahooResponseSchema.js';
import type { YahooChartResponse } from './yahooResponseSchema.js';

export interface YahooChartProviderConfig {
  readonly baseUrl: string;
  /** Yahoo rejects requests without a browser-like User-Agent (HTTP 429). */
  readonly userAgent: string;
  readonly timeoutMs: number;
  readonly retryPolicy: RetryPolicy;
}

/** MarketDataProvider backed by Yahoo Finance's public (unofficial) chart API. */
export class YahooChartProvider implements MarketDataProvider {
  /**
   * Rocko Bishop
   * Creates the provider with its configuration and injectable HTTP side effects.
   * @param config - Endpoint, User-Agent, timeout and retry policy.
   * @param httpDeps - fetch, sleep and randomness; real implementations by default.
   */
  constructor(
    private readonly config: YahooChartProviderConfig,
    private readonly httpDeps: FetchWithRetryDeps = defaultFetchWithRetryDeps,
  ) {}

  /**
   * Rocko Bishop
   * Fetches, validates and maps the intraday series for one symbol. Every failure leaves as one
   * of the documented application errors.
   * @param symbol - Validated, upper-cased ticker.
   * @param range - Epoch-second range to request.
   * @returns The symbol's intraday series.
   */
  async getIntradaySeries(symbol: string, range: FetchRange): Promise<IntradaySeries> {
    const response = await this.request(symbol, range);
    assertUsableStatus(response);
    const payload = validatePayload(await readJson(response));
    assertNotFoundIsGenuine(response, payload);
    return mapYahooChartResponse(payload, symbol);
  }

  /**
   * Rocko Bishop
   * Sends the HTTP request with retries and turns transport failures into
   * UpstreamUnavailableError.
   * @param symbol - Validated ticker.
   * @param range - Epoch-second range.
   * @returns The final HTTP response.
   */
  private async request(symbol: string, range: FetchRange): Promise<Response> {
    try {
      return await fetchWithRetry(
        {
          url: buildYahooChartUrl(this.config.baseUrl, symbol, range),
          headers: { 'User-Agent': this.config.userAgent, Accept: 'application/json' },
          timeoutMs: this.config.timeoutMs,
        },
        this.config.retryPolicy,
        this.httpDeps,
      );
    } catch (error) {
      if (error instanceof HttpTransportError) {
        throw new UpstreamUnavailableError('Yahoo Finance could not be reached', { cause: error });
      }
      throw error;
    }
  }
}

/**
 * Rocko Bishop
 * Maps non-success statuses to application errors. A 404 passes through, because Yahoo describes
 * unknown symbols in the body, which the mapper interprets. Transient statuses that survived every
 * retry mean the upstream is unavailable.
 * @param response - The final HTTP response.
 */
function assertUsableStatus(response: Response): void {
  if (response.ok || response.status === 404) {
    return;
  }
  if (isRetryableStatus(response.status)) {
    throw new UpstreamUnavailableError(`Yahoo Finance responded with HTTP ${response.status}`);
  }
  throw new UpstreamResponseError(`Yahoo Finance responded with HTTP ${response.status}`);
}

/**
 * Rocko Bishop
 * Guards against reporting a misconfigured endpoint as an unknown symbol: a 404 counts as "symbol
 * not found" only when Yahoo's body says so through `chart.error`.
 * @param response - The final HTTP response.
 * @param payload - The validated body.
 */
function assertNotFoundIsGenuine(response: Response, payload: YahooChartResponse): void {
  if (response.status === 404 && !payload.chart.error) {
    throw new UpstreamResponseError('Yahoo Finance responded with HTTP 404 without an error body');
  }
}

/**
 * Rocko Bishop
 * Parses the body as JSON, treating malformed or truncated bodies as a bad upstream response
 * rather than an unhandled crash.
 * @param response - A successful HTTP response.
 * @returns The parsed, still untrusted, JSON value.
 */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new UpstreamResponseError('Yahoo Finance returned a body that is not valid JSON', {
      cause: error,
    });
  }
}

/**
 * Rocko Bishop
 * Checks the untrusted JSON against the expected Yahoo shape, so that schema drift fails loudly
 * with the exact offending fields.
 * @param json - The parsed body.
 * @returns The typed payload.
 */
function validatePayload(json: unknown): YahooChartResponse {
  const parsed = yahooChartResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new UpstreamResponseError(
      `Yahoo Finance response did not match the expected shape: ${parsed.error.message}`,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}
