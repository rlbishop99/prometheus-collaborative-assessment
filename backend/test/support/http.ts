import { readFileSync } from 'node:fs';

import { vi } from 'vitest';

import type { FetchWithRetryDeps } from '../../src/infra/http/fetchWithRetry.js';
import type { RetryPolicy } from '../../src/infra/http/retryPolicy.js';
import type { YahooChartProviderConfig } from '../../src/providers/yahoo/yahooChartProvider.js';

export type YahooFixture = 'tsla-15m' | 'with-null-bars' | 'empty-range' | 'not-found';

export const loadYahooFixture = (name: YahooFixture): unknown =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/yahoo/${name}.json`, import.meta.url), 'utf8'),
  ) as unknown;

export const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

export const textResponse = (body: string, status: number): Response =>
  new Response(body, { status });

/** A fetch stub that replays the given outcomes in order (a thrown Error = transport failure). */
export const sequencedFetch = (
  ...outcomes: (Response | Error)[]
): ReturnType<typeof vi.fn<typeof fetch>> => {
  const queue = [...outcomes];
  return vi.fn<typeof fetch>(() => {
    const next = queue.shift();
    if (!next) {
      return Promise.reject(new Error('sequencedFetch: no more outcomes queued'));
    }
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  });
};

export const instantDeps = (
  fetchFn: typeof fetch,
): FetchWithRetryDeps & {
  sleep: ReturnType<typeof vi.fn<(ms: number) => Promise<void>>>;
} => ({
  fetchFn,
  sleep: vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve()),
  random: () => 0.5,
});

export const testRetryPolicy: RetryPolicy = { maxRetries: 2, baseDelayMs: 100, maxDelayMs: 1_000 };

export const testYahooConfig: YahooChartProviderConfig = {
  baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  timeoutMs: 5_000,
  retryPolicy: testRetryPolicy,
};
