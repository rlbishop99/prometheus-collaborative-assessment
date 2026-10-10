import { createDailySummaryClient } from './api/dailySummaryClient';
import { appConfig } from './config';
import type { SymbolSearchDeps } from './hooks/useSymbolSearch';
import { SessionCache } from './state/sessionCache';

/**
 * Rocko Bishop
 * Composition root for the browser: builds the real client, the session cache and the clock from
 * config. Created once per page load and passed down, which keeps components free of `new`.
 * @returns The production dependencies.
 */
export function createAppDependencies(): SymbolSearchDeps {
  const clock = (): number => Date.now();
  return {
    client: createDailySummaryClient({
      baseUrl: appConfig.apiBaseUrl,
      timeoutMs: appConfig.requestTimeoutMs,
    }),
    cache: new SessionCache({
      ttlMs: appConfig.cacheTtlMs,
      maxEntries: appConfig.cacheMaxEntries,
      clock,
    }),
    clock,
  };
}
