import type { DailySummaries } from '../domain/types';
import { ApiError, isAbortError } from './apiError';
import { errorFromResponse } from './classifyResponse';
import { dailySummariesSchema } from './schemas';

/** The operations the UI needs from the backend; implemented over HTTP below, faked in tests. */
export interface DailySummaryClient {
  fetchDailySummaries(symbol: string, signal?: AbortSignal): Promise<DailySummaries>;
}

export interface DailySummaryClientOptions {
  /** Origin of the API. Empty means same-origin (the Vite proxy in development). */
  readonly baseUrl: string;
  /** Upper bound per request. The backend's own retries fit well within it. */
  readonly timeoutMs: number;
  readonly fetchFn?: typeof fetch;
}

/** The HTTP implementation of DailySummaryClient. */
export class HttpDailySummaryClient implements DailySummaryClient {
  constructor(private readonly options: DailySummaryClientOptions) {}

  /**
   * Rocko Bishop
   * Fetches and validates a symbol's summaries. Every failure surfaces as an ApiError, except a
   * caller-initiated abort, which propagates as an AbortError so it can be ignored.
   */
  async fetchDailySummaries(symbol: string, signal?: AbortSignal): Promise<DailySummaries> {
    const response = await this.send(buildDailySummaryUrl(this.options.baseUrl, symbol), signal);
    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    return parseSuccessBody(response);
  }

  /**
   * Rocko Bishop
   * Performs the GET under a combined signal: the caller's cancellation plus our timeout. Network
   * failures and timeouts both mean the data source is unreachable.
   */
  private async send(url: string, signal: AbortSignal | undefined): Promise<Response> {
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const fetchFn = this.options.fetchFn ?? ((input, init) => fetch(input, init));
    try {
      return await fetchFn(url, { headers: { Accept: 'application/json' }, signal: combined });
    } catch (error) {
      if (signal?.aborted && isAbortError(error)) {
        throw error;
      }
      throw new ApiError('unreachable', `Request to ${url} failed`, { cause: error });
    }
  }
}

export function buildDailySummaryUrl(baseUrl: string, symbol: string): string {
  const origin = baseUrl.replace(/\/+$/, '');
  return `${origin}/api/v1/stocks/${encodeURIComponent(symbol)}/daily-summary`;
}

/**
 * Rocko Bishop
 * Reads and validates a 2xx body. A body that is not the agreed contract is a server-side bug, not
 * user error, so it is classified `unknown`.
 */
async function parseSuccessBody(response: Response): Promise<DailySummaries> {
  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new ApiError('unknown', 'Response body is not valid JSON', { cause: error });
  }
  const parsed = dailySummariesSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError('unknown', `Unexpected response shape: ${parsed.error.message}`, {
      cause: parsed.error,
    });
  }
  return parsed.data;
}
