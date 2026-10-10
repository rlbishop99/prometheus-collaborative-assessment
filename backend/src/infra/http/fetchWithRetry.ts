import { setTimeout as delay } from 'node:timers/promises';

import { HttpTransportError } from './httpTransportError.js';
import { computeBackoffDelayMs, isRetryableStatus, parseRetryAfterMs } from './retryPolicy.js';
import type { RetryPolicy } from './retryPolicy.js';

export interface HttpGetRequest {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  /** Per-attempt timeout; each retry gets a fresh budget. */
  readonly timeoutMs: number;
}

/** Side effects are injectable, so retry timing can be tested deterministically. */
export interface FetchWithRetryDeps {
  readonly fetchFn: typeof fetch;
  readonly sleep: (ms: number) => Promise<void>;
  readonly random: () => number;
}

export const defaultFetchWithRetryDeps: FetchWithRetryDeps = {
  fetchFn: (input, init) => fetch(input, init),
  sleep: (ms) => delay(ms),
  random: Math.random,
};

/**
 * Rocko Bishop
 * Performs a GET with a per-attempt timeout and capped retries on transient failures (network
 * errors, timeouts, 408/429/5xx). Every other response, including 4xx, is returned to the caller
 * to interpret.
 * @param request - URL, headers and per-attempt timeout.
 * @param policy - Retry cap and backoff bounds.
 * @param deps - Injectable fetch, sleep and randomness.
 * @returns The final HTTP response, which may itself be a retryable status once retries run out.
 */
export async function fetchWithRetry(
  request: HttpGetRequest,
  policy: RetryPolicy,
  deps: FetchWithRetryDeps = defaultFetchWithRetryDeps,
): Promise<Response> {
  const totalAttempts = policy.maxRetries + 1;

  for (let attempt = 1; ; attempt++) {
    const isLastAttempt = attempt >= totalAttempts;
    try {
      const response = await attemptFetch(request, deps.fetchFn);
      if (isLastAttempt || !isRetryableStatus(response.status)) {
        return response;
      }
      const hintMs = parseRetryAfterMs(response.headers.get('retry-after'), policy);
      await discardBody(response);
      await deps.sleep(hintMs ?? computeBackoffDelayMs(attempt - 1, policy, deps.random));
    } catch (error) {
      if (isLastAttempt) {
        throw new HttpTransportError(attempt, error);
      }
      await deps.sleep(computeBackoffDelayMs(attempt - 1, policy, deps.random));
    }
  }
}

/**
 * Rocko Bishop
 * Runs a single GET bounded by its own timeout signal, so a hung connection cannot consume the
 * retry budget of the attempts after it.
 * @param request - URL, headers and timeout.
 * @param fetchFn - The fetch implementation.
 * @returns The HTTP response for this attempt.
 */
function attemptFetch(request: HttpGetRequest, fetchFn: typeof fetch): Promise<Response> {
  return fetchFn(request.url, {
    method: 'GET',
    headers: request.headers,
    signal: AbortSignal.timeout(request.timeoutMs),
  });
}

/**
 * Rocko Bishop
 * Releases the body of a response that is about to be retried, so the underlying connection can be
 * reused. Failures are ignored, because the response is being discarded anyway.
 * @param response - The response to drain.
 */
async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Nothing useful to do; the retry proceeds regardless.
  }
}
