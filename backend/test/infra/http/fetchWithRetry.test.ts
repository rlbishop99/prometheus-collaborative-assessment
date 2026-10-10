import { describe, expect, it } from 'vitest';

import { fetchWithRetry } from '../../../src/infra/http/fetchWithRetry.js';
import { HttpTransportError } from '../../../src/infra/http/httpTransportError.js';
import {
  instantDeps,
  jsonResponse,
  sequencedFetch,
  testRetryPolicy,
  textResponse,
} from '../../support/http.js';

const request = { url: 'https://example.test/data', headers: { 'User-Agent': 'x' }, timeoutMs: 50 };

describe('fetchWithRetry', () => {
  it('returns the first successful response without retrying', async () => {
    const fetchFn = sequencedFetch(jsonResponse({ ok: true }));
    const deps = instantDeps(fetchFn);

    const response = await fetchWithRetry(request, testRetryPolicy, deps);

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(deps.sleep).not.toHaveBeenCalled();
  });

  it('sends the headers and a per-attempt abort signal', async () => {
    const fetchFn = sequencedFetch(jsonResponse({}));
    await fetchWithRetry(request, testRetryPolicy, instantDeps(fetchFn));

    const init = fetchFn.mock.calls[0]?.[1];
    expect(init?.headers).toEqual({ 'User-Agent': 'x' });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('retries transient statuses and then succeeds', async () => {
    const fetchFn = sequencedFetch(
      textResponse('busy', 503),
      textResponse('slow', 429),
      jsonResponse({}),
    );
    const deps = instantDeps(fetchFn);

    const response = await fetchWithRetry(request, testRetryPolicy, deps);

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(deps.sleep.mock.calls.map(([ms]) => ms)).toEqual([50, 100]);
  });

  it('honours a Retry-After hint, capped by the policy', async () => {
    const fetchFn = sequencedFetch(
      jsonResponse({}, 429, { 'retry-after': '60' }),
      jsonResponse({}),
    );
    const deps = instantDeps(fetchFn);

    await fetchWithRetry(request, testRetryPolicy, deps);

    expect(deps.sleep).toHaveBeenCalledWith(1_000);
  });

  it('returns the final transient response once retries are exhausted', async () => {
    const fetchFn = sequencedFetch(
      textResponse('a', 503),
      textResponse('b', 503),
      textResponse('c', 503),
    );

    const response = await fetchWithRetry(request, testRetryPolicy, instantDeps(fetchFn));

    expect(response.status).toBe(503);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('never retries deterministic client errors', async () => {
    const fetchFn = sequencedFetch(textResponse('missing', 404));

    const response = await fetchWithRetry(request, testRetryPolicy, instantDeps(fetchFn));

    expect(response.status).toBe(404);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retries transport failures and recovers', async () => {
    const fetchFn = sequencedFetch(new TypeError('fetch failed'), jsonResponse({}));

    const response = await fetchWithRetry(request, testRetryPolicy, instantDeps(fetchFn));

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws HttpTransportError when every attempt fails to connect', async () => {
    const timeout = new DOMException('The operation timed out.', 'TimeoutError');
    const fetchFn = sequencedFetch(new TypeError('fetch failed'), timeout, timeout);

    const error = await fetchWithRetry(request, testRetryPolicy, instantDeps(fetchFn)).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(HttpTransportError);
    expect((error as HttpTransportError).attempts).toBe(3);
    expect((error as HttpTransportError).cause).toBe(timeout);
  });

  it('makes exactly one attempt when retries are disabled', async () => {
    const fetchFn = sequencedFetch(textResponse('busy', 503));

    const response = await fetchWithRetry(
      request,
      { ...testRetryPolicy, maxRetries: 0 },
      instantDeps(fetchFn),
    );

    expect(response.status).toBe(503);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('aborts a hung attempt using the real timeout signal', async () => {
    const hangingFetch: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason as Error);
        });
      });

    const error = await fetchWithRetry(
      { ...request, timeoutMs: 20 },
      { ...testRetryPolicy, maxRetries: 0 },
      instantDeps(hangingFetch),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpTransportError);
  });
});
