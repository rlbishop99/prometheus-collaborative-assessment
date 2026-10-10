import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../src/app.js';
import { loadConfig } from '../../src/config/appConfig.js';
import {
  InvalidSymbolError,
  SymbolNotFoundError,
  UpstreamResponseError,
  UpstreamUnavailableError,
} from '../../src/errors/appErrors.js';
import type { DailySummaries } from '../../src/domain/types.js';
import type { DailySummaryReader } from '../../src/services/dailySummaryService.js';

const summaries: DailySummaries = [
  { day: '2026-10-08', lowAverage: 40.2958, highAverage: 49.7534, volume: 49_073_348 },
  { day: '2026-10-09', lowAverage: 41, highAverage: 50.1, volume: 1_000 },
];

interface ReaderMock {
  readonly getDailySummaries: ReturnType<typeof vi.fn<DailySummaryReader['getDailySummaries']>>;
}

let app: FastifyInstance | undefined;

const startApp = async (reader: ReaderMock): Promise<FastifyInstance> => {
  app = await buildApp({
    config: loadConfig({}),
    createServices: () => ({ dailySummaries: reader }),
    logger: false,
  });
  return app;
};

const readerResolving = (value: DailySummaries = summaries): ReaderMock => ({
  getDailySummaries: vi.fn<DailySummaryReader['getDailySummaries']>(() => Promise.resolve(value)),
});

const readerRejecting = (error: Error): ReaderMock => ({
  getDailySummaries: vi.fn<DailySummaryReader['getDailySummaries']>(() => Promise.reject(error)),
});

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /api/v1/stocks/:symbol/daily-summary', () => {
  it('returns the summaries in the exact contract shape and precision', async () => {
    const server = await startApp(readerResolving());

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toBe(
      '[{"day":"2026-10-08","lowAverage":40.2958,"highAverage":49.7534,"volume":49073348},' +
        '{"day":"2026-10-09","lowAverage":41,"highAverage":50.1,"volume":1000}]',
    );
  });

  it('passes the raw path parameter to the use case for validation', async () => {
    const reader = readerResolving();
    const server = await startApp(reader);

    await server.inject({ url: '/api/v1/stocks/brk.b/daily-summary' });

    expect(reader.getDailySummaries).toHaveBeenCalledWith('brk.b');
  });

  it('decodes percent-encoded symbols such as ^GSPC', async () => {
    const reader = readerResolving();
    const server = await startApp(reader);

    await server.inject({ url: '/api/v1/stocks/%5EGSPC/daily-summary' });

    expect(reader.getDailySummaries).toHaveBeenCalledWith('^GSPC');
  });

  it('strips fields outside the contract', async () => {
    const leaky = [{ ...summaries[0], internal: 'secret' }] as unknown as DailySummaries;
    const server = await startApp(readerResolving(leaky));

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });

    expect(response.body).not.toContain('secret');
  });

  it('returns an empty array when there were no trades', async () => {
    const server = await startApp(readerResolving([]));

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('accepts a trailing slash', async () => {
    const server = await startApp(readerResolving());

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary/' });

    expect(response.statusCode).toBe(200);
  });

  it.each([
    [new InvalidSymbolError('Symbol must be 1-15 characters'), 400, '/problems/invalid-symbol'],
    [new SymbolNotFoundError('No data found for symbol "ZZZZ"'), 404, '/problems/symbol-not-found'],
    [new UpstreamResponseError('bad payload'), 502, '/problems/upstream-bad-response'],
    [new UpstreamUnavailableError('timeout'), 503, '/problems/upstream-unavailable'],
  ])('maps %s to an RFC 7807 problem', async (error, status, type) => {
    const server = await startApp(readerRejecting(error));

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });

    expect(response.statusCode).toBe(status);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.json()).toEqual({
      type,
      title: error.title,
      status,
      detail: error.publicDetail,
      instance: '/api/v1/stocks/TSLA/daily-summary',
    });
  });

  it.each([
    new UpstreamResponseError('Zod: expected array at chart.result'),
    new UpstreamUnavailableError('Yahoo HTTP 503'),
  ])('keeps upstream internals out of the %s response', async (error) => {
    const server = await startApp(readerRejecting(error));

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });

    expect(response.body).not.toContain(error.message);
  });

  it('hides the details of unexpected errors behind a generic 500', async () => {
    const server = await startApp(readerRejecting(new Error('db password is hunter2')));

    const response = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });

    expect(response.statusCode).toBe(500);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).not.toContain('hunter2');
    expect(response.json()).toMatchObject({ type: 'about:blank', title: 'Internal Server Error' });
  });
});

describe('other routes', () => {
  it('serves a liveness probe', async () => {
    const server = await startApp(readerResolving());

    const response = await server.inject({ url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('answers unknown routes with a 404 problem', async () => {
    const server = await startApp(readerResolving());

    const response = await server.inject({ url: '/api/v1/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.json()).toMatchObject({ status: 404, instance: '/api/v1/nope' });
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin', async () => {
    const server = await startApp(readerResolving());

    const response = await server.inject({
      method: 'OPTIONS',
      url: '/api/v1/stocks/TSLA/daily-summary',
      headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'GET' },
    });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not grant other origins', async () => {
    const server = await startApp(readerResolving());

    const response = await server.inject({
      url: '/api/v1/stocks/TSLA/daily-summary',
      headers: { origin: 'https://evil.example' },
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
