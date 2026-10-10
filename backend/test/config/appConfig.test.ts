import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../../src/config/appConfig.js';

describe('loadConfig', () => {
  it('provides production-safe defaults for an empty environment', () => {
    const config = loadConfig({});

    expect(config.server).toEqual({ host: '127.0.0.1', port: 3000, logLevel: 'info' });
    expect(config.cache).toEqual({ ttlMs: 120_000, maxEntries: 500 });
    expect(config.window).toEqual({ windowDays: 30, fetchBufferDays: 2 });
    expect(config.yahoo.baseUrl).toBe('https://query1.finance.yahoo.com/v8/finance/chart');
    expect(config.yahoo.userAgent).toMatch(/^Mozilla\/5\.0/);
    expect(config.yahoo.retryPolicy).toEqual({
      maxRetries: 2,
      baseDelayMs: 200,
      maxDelayMs: 2_000,
    });
    expect(config.cors.origins).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173']);
  });

  it('coerces and applies overrides', () => {
    const config = loadConfig({
      PORT: '8080',
      HOST: '0.0.0.0',
      LOG_LEVEL: 'debug',
      CACHE_TTL_MS: '60000',
      UPSTREAM_MAX_RETRIES: '0',
    });

    expect(config.server).toEqual({ host: '0.0.0.0', port: 8080, logLevel: 'debug' });
    expect(config.cache.ttlMs).toBe(60_000);
    expect(config.yahoo.retryPolicy.maxRetries).toBe(0);
  });

  it('splits and trims the CORS origin list, ignoring blanks', () => {
    const config = loadConfig({ CORS_ORIGINS: ' https://a.example , ,https://b.example ' });
    expect(config.cors.origins).toEqual(['https://a.example', 'https://b.example']);
  });

  it('treats blank variables as unset', () => {
    expect(loadConfig({ PORT: '', CACHE_TTL_MS: '   ' }).server.port).toBe(3000);
  });

  it('reports every invalid variable at once', () => {
    let error: unknown;
    try {
      loadConfig({ PORT: 'eighty', LOG_LEVEL: 'loud', YAHOO_BASE_URL: 'not a url' });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ConfigError);
    const issues = (error as ConfigError).issues.join('\n');
    expect(issues).toContain('PORT');
    expect(issues).toContain('LOG_LEVEL');
    expect(issues).toContain('YAHOO_BASE_URL');
  });

  it.each([
    { PORT: '70000' },
    { UPSTREAM_MAX_RETRIES: '50' },
    { CACHE_TTL_MS: '0' },
    { WINDOW_DAYS: '1.5' },
    { UPSTREAM_RETRY_BASE_DELAY_MS: '5000', UPSTREAM_RETRY_MAX_DELAY_MS: '1000' },
  ])('rejects out-of-range values %o', (env) => {
    expect(() => loadConfig(env)).toThrow(ConfigError);
  });

  it('returns a deeply frozen config', () => {
    const config = loadConfig({});
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.yahoo.retryPolicy)).toBe(true);
    expect(Object.isFrozen(config.cors.origins)).toBe(true);
  });
});
