import { describe, expect, it, vi } from 'vitest';

import { ApiError, isAbortError } from '../../src/api/apiError';
import { buildDailySummaryUrl, HttpDailySummaryClient } from '../../src/api/dailySummaryClient';
import { jsonResponse, problemResponse, tslaSummaries } from '../support/fixtures';

const clientWith = (fetchFn: typeof fetch, timeoutMs = 1_000): HttpDailySummaryClient =>
  new HttpDailySummaryClient({ baseUrl: '', timeoutMs, fetchFn });

const respondWith = (response: Response): ReturnType<typeof vi.fn<typeof fetch>> =>
  vi.fn<typeof fetch>(() => Promise.resolve(response));

const failureOf = async (promise: Promise<unknown>): Promise<ApiError> => {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
};

describe('buildDailySummaryUrl', () => {
  it('builds a same-origin path by default', () => {
    expect(buildDailySummaryUrl('', 'TSLA')).toBe('/api/v1/stocks/TSLA/daily-summary');
  });

  it('prefixes a configured origin and tolerates a trailing slash', () => {
    expect(buildDailySummaryUrl('https://api.example.com/', 'TSLA')).toBe(
      'https://api.example.com/api/v1/stocks/TSLA/daily-summary',
    );
  });

  it('percent-encodes special characters', () => {
    expect(buildDailySummaryUrl('', '^GSPC')).toBe('/api/v1/stocks/%5EGSPC/daily-summary');
  });
});

describe('DailySummaryClient', () => {
  it('returns validated summaries on success', async () => {
    const fetchFn = respondWith(jsonResponse(tslaSummaries));

    await expect(clientWith(fetchFn).fetchDailySummaries('TSLA')).resolves.toEqual(tslaSummaries);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/v1/stocks/TSLA/daily-summary',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('accepts an empty array (no trades in the window)', async () => {
    await expect(
      clientWith(respondWith(jsonResponse([]))).fetchDailySummaries('TSLA'),
    ).resolves.toEqual([]);
  });

  it.each([
    [problemResponse(400, '/problems/invalid-symbol'), 'invalidInput'],
    [problemResponse(404, '/problems/symbol-not-found'), 'notFound'],
    [problemResponse(404, 'about:blank'), 'unknown'],
    [new Response('<html>Not Found</html>', { status: 404 }), 'unknown'],
    [problemResponse(502, '/problems/upstream-bad-response'), 'unreachable'],
    [problemResponse(503, '/problems/upstream-unavailable'), 'unreachable'],
    [new Response('Bad Gateway', { status: 504 }), 'unreachable'],
    [problemResponse(500, 'about:blank'), 'unknown'],
  ] as const)('classifies HTTP %#', async (response, kind) => {
    const error = await failureOf(clientWith(respondWith(response)).fetchDailySummaries('TSLA'));

    expect(error.kind).toBe(kind);
  });

  it('classifies network failures as unreachable', async () => {
    const fetchFn = vi.fn<typeof fetch>(() => Promise.reject(new TypeError('Failed to fetch')));

    expect((await failureOf(clientWith(fetchFn).fetchDailySummaries('TSLA'))).kind).toBe(
      'unreachable',
    );
  });

  it('classifies its own timeout as unreachable', async () => {
    const hanging: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason as Error);
        });
      });

    const error = await failureOf(clientWith(hanging, 20).fetchDailySummaries('TSLA'));

    expect(error.kind).toBe('unreachable');
  });

  it('propagates a caller abort as an AbortError, not an ApiError', async () => {
    const controller = new AbortController();
    const hanging: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

    const pending = clientWith(hanging).fetchDailySummaries('TSLA', controller.signal);
    controller.abort();
    const error = await pending.catch((caught: unknown) => caught);

    expect(isAbortError(error)).toBe(true);
  });

  it('classifies a non-JSON success body as unknown', async () => {
    const fetchFn = respondWith(new Response('<html>oops</html>', { status: 200 }));

    expect((await failureOf(clientWith(fetchFn).fetchDailySummaries('TSLA'))).kind).toBe('unknown');
  });

  it.each([
    [{ not: 'an array' }],
    [[{ day: '2026-10-09', lowAverage: '1', highAverage: 2, volume: 3 }]],
    [[{ day: 'Oct 9', lowAverage: 1, highAverage: 2, volume: 3 }]],
    [[{ day: '2026-10-09', lowAverage: 1, highAverage: 2, volume: 1.5 }]],
  ])('classifies a body that breaks the contract as unknown (%#)', async (body) => {
    const error = await failureOf(
      clientWith(respondWith(jsonResponse(body))).fetchDailySummaries('TSLA'),
    );

    expect(error.kind).toBe('unknown');
  });
});
