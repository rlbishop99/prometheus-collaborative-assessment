import { HttpDailySummaryClient } from './api/dailySummaryClient';
import { appConfig } from './config';
import type { SymbolSearchDeps } from './hooks/useSymbolSearch';
import { SessionCache } from './state/sessionCache';

/**
 * Rocko Bishop
 * Composition root for the browser: builds the real client and the session cache from config.
 * Created once per page load and passed down, which keeps components free of `new`.
 */
export function createAppDependencies(): SymbolSearchDeps {
  return {
    client: new HttpDailySummaryClient({
      baseUrl: appConfig.apiBaseUrl,
      timeoutMs: appConfig.requestTimeoutMs,
    }),
    cache: new SessionCache({ maxEntries: appConfig.cacheMaxEntries }),
  };
}
