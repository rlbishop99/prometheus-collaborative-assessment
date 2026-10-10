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
  constructor(
    private readonly config: YahooChartProviderConfig,
    private readonly httpDeps: FetchWithRetryDeps = defaultFetchWithRetryDeps,
  ) {}

  /**
   * Rocko Bishop
   * Fetches, validates and maps the intraday series for one symbol. Every failure leaves as one
   * of the documented application errors.
   */
  async getIntradaySeries(symbol: string, range: FetchRange): Promise<IntradaySeries> {
    const response = await this.request(symbol, range);
    assertUsableStatus(response);
    const payload = validatePayload(await readJson(response));
    assertNotFoundIsGenuine(response, payload);
    return mapYahooChartResponse(payload, symbol);
  }

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
 */
function assertNotFoundIsGenuine(response: Response, payload: YahooChartResponse): void {
  if (response.status === 404 && !payload.chart.error) {
    throw new UpstreamResponseError('Yahoo Finance responded with HTTP 404 without an error body');
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new UpstreamResponseError('Yahoo Finance returned a body that is not valid JSON', {
      cause: error,
    });
  }
}

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
