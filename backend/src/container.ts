import type { AppConfig } from './config/appConfig.js';
import { InFlightDeduper } from './infra/cache/inFlightDeduper.js';
import { InMemoryTtlCache } from './infra/cache/inMemoryTtlCache.js';
import type { Clock } from './infra/clock.js';
import { systemClock } from './infra/clock.js';
import { defaultFetchWithRetryDeps } from './infra/http/fetchWithRetry.js';
import type { FetchWithRetryDeps } from './infra/http/fetchWithRetry.js';
import type { Logger } from './infra/logging/logger.js';
import { YahooChartProvider } from './providers/yahoo/yahooChartProvider.js';
import type { DailySummaries, DailySummaryReader } from './services/dailySummaryService.js';
import { DailySummaryService } from './services/dailySummaryService.js';

/** Everything the HTTP layer needs. New use cases are added here as the API grows. */
export interface AppServices {
  readonly dailySummaries: DailySummaryReader;
}

/** Seams for tests; production code passes none of these. */
export interface ContainerOverrides {
  readonly httpDeps?: FetchWithRetryDeps;
  readonly clock?: Clock;
}

/**
 * Rocko Bishop
 * Composition root: the one place that knows the concrete classes and wires them together, so
 * every other module depends only on abstractions.
 * @param config - Validated application config.
 * @param logger - Logger for best-effort failures (e.g. the cache).
 * @param overrides - Optional test seams for network and time.
 * @returns The application services.
 */
export function createAppServices(
  config: AppConfig,
  logger: Logger,
  overrides: ContainerOverrides = {},
): AppServices {
  const clock = overrides.clock ?? systemClock;
  const provider = new YahooChartProvider(
    config.yahoo,
    overrides.httpDeps ?? defaultFetchWithRetryDeps,
  );

  const dailySummaries = new DailySummaryService(config.window, {
    provider,
    cache: new InMemoryTtlCache<string, DailySummaries>({ ...config.cache, clock }),
    deduper: new InFlightDeduper<string, DailySummaries>(),
    clock,
    logger,
  });

  return { dailySummaries };
}
