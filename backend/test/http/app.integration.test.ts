/*
 * Full-stack test: the real composition root (Fastify -> service -> cache -> deduper -> Yahoo
 * provider -> aggregation), with only the network and the clock stubbed. It replays the real
 * Yahoo capture, so it is deterministic and offline.
 */
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../src/app.js';
import { loadConfig } from '../../src/config/appConfig.js';
import { createAppServices } from '../../src/container.js';
import { manualClock } from '../support/clock.js';
import type { ManualClock } from '../support/clock.js';
import { instantDeps, jsonResponse, loadYahooFixture } from '../support/http.js';

let app: FastifyInstance | undefined;

const startStack = async (
  respond: () => Response,
): Promise<{ server: FastifyInstance; calls: () => number; time: ManualClock }> => {
  let calls = 0;
  const fetchFn: typeof fetch = () => {
    calls++;
    return Promise.resolve(respond());
  };
  const fixtureBars = (
    loadYahooFixture('tsla-15m') as { chart: { result: [{ timestamp: number[] }] } }
  ).chart.result[0].timestamp;
  // Pin "now" to just after the capture's last bar, so the 30-day window covers the fixture.
  const time = manualClock(new Date(((fixtureBars.at(-1) ?? 0) + 900) * 1000).toISOString());
  const config = loadConfig({});

  app = await buildApp({
    config,
    logger: false,
    createServices: (logger) =>
      createAppServices(config, logger, { httpDeps: instantDeps(fetchFn), clock: time.clock }),
  });
  return { server: app, calls: () => calls, time };
};

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('daily-summary endpoint (full stack)', () => {
  it('aggregates the real Yahoo capture into the contract', async () => {
    const { server } = await startStack(() => jsonResponse(loadYahooFixture('tsla-15m')));

    const response = await server.inject({ url: '/api/v1/stocks/tsla/daily-summary' });
    const body =
      response.json<{ day: string; lowAverage: number; highAverage: number; volume: number }[]>();

    expect(response.statusCode).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(15);
    expect(body.map((d) => d.day)).toEqual(body.map((d) => d.day).sort());
    for (const day of body) {
      expect(Object.keys(day)).toEqual(['day', 'lowAverage', 'highAverage', 'volume']);
      expect(Number(day.lowAverage.toFixed(4))).toBe(day.lowAverage);
      expect(day.lowAverage).toBeLessThanOrEqual(day.highAverage);
      expect(Number.isSafeInteger(day.volume)).toBe(true);
    }
  });

  it('serves from cache for 2 minutes, then re-queries Yahoo', async () => {
    const { server, calls, time } = await startStack(() =>
      jsonResponse(loadYahooFixture('tsla-15m')),
    );

    await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });
    time.advance(119_999);
    await server.inject({ url: '/api/v1/stocks/tsla/daily-summary' });
    expect(calls()).toBe(1);

    time.advance(1);
    await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });
    expect(calls()).toBe(2);
  });

  it('returns 404 for an unknown symbol', async () => {
    const { server } = await startStack(() => jsonResponse(loadYahooFixture('not-found'), 404));

    const response = await server.inject({ url: '/api/v1/stocks/ZZZZNOTREAL/daily-summary' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ type: '/problems/symbol-not-found' });
  });

  it.each(['bad!sym', ''])(
    'returns 400 without calling Yahoo for the malformed symbol %j',
    async (symbol) => {
      const { server, calls } = await startStack(() => jsonResponse({}));

      const response = await server.inject({ url: `/api/v1/stocks/${symbol}/daily-summary` });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ type: '/problems/invalid-symbol' });
      expect(calls()).toBe(0);
    },
  );

  it('returns 503 after retries when Yahoo keeps failing, and does not cache the failure', async () => {
    let healthy = false;
    const { server, calls } = await startStack(() =>
      healthy ? jsonResponse(loadYahooFixture('tsla-15m')) : new Response('', { status: 503 }),
    );

    const failed = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });
    expect(failed.statusCode).toBe(503);
    expect(calls()).toBe(3);

    healthy = true;
    const recovered = await server.inject({ url: '/api/v1/stocks/TSLA/daily-summary' });
    expect(recovered.statusCode).toBe(200);
  });
});
