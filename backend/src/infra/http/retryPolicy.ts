/** How many times, and how patiently, a failed request is retried. */
export interface RetryPolicy {
  /** Retries after the first attempt; 0 disables retrying. */
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

/** 408 Request Timeout, 429 Too Many Requests, and all 5xx statuses are transient. */
const RETRYABLE_CLIENT_STATUSES = new Set([408, 429]);

/**
 * Rocko Bishop
 * Decides whether an HTTP status is transient and worth retrying. Other 4xx statuses are
 * deterministic, so retrying them would only add load and latency.
 * @param status - The HTTP response status.
 * @returns True for 408, 429 and 5xx.
 */
export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_CLIENT_STATUSES.has(status) || (status >= 500 && status <= 599);
}

/**
 * Rocko Bishop
 * Exponential backoff with full jitter: a random delay in [0, min(max, base * 2^attempt)]. The
 * jitter keeps many clients from retrying in lockstep against a struggling upstream.
 * @param retryNumber - Zero-based index of the retry being scheduled.
 * @param policy - Base and maximum delays.
 * @param random - Source of randomness in [0, 1); injectable for deterministic tests.
 * @returns Delay before the retry, in milliseconds.
 */
export function computeBackoffDelayMs(
  retryNumber: number,
  policy: RetryPolicy,
  random: () => number = Math.random,
): number {
  const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** retryNumber);
  return Math.floor(random() * ceiling);
}

/**
 * Rocko Bishop
 * Reads a `Retry-After` header given in seconds and caps it at the policy maximum, so the server's
 * hint is honoured without letting it stall the request indefinitely. HTTP-date values are
 * ignored in favour of normal backoff.
 * @param headerValue - Raw header value, or null when absent.
 * @param policy - Supplies the maximum delay.
 * @returns The capped delay in milliseconds, or undefined when there is no usable hint.
 */
export function parseRetryAfterMs(
  headerValue: string | null,
  policy: RetryPolicy,
): number | undefined {
  if (headerValue === null || !/^\d+$/.test(headerValue.trim())) {
    return undefined;
  }
  return Math.min(Number(headerValue.trim()) * 1000, policy.maxDelayMs);
}
