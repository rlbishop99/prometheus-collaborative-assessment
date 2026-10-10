import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';

import type { AppConfig } from './config/appConfig.js';
import type { AppServices } from './container.js';
import { registerErrorHandling } from './http/errorHandling.js';
import { registerDailySummaryRoute } from './http/routes/dailySummaryRoute.js';
import { registerHealthRoute } from './http/routes/healthRoute.js';
import type { Logger } from './infra/logging/logger.js';

export interface BuildAppOptions {
  readonly config: AppConfig;
  /** Builds the services once the app's logger exists, so both share one logger. */
  readonly createServices: (logger: Logger) => AppServices;
  /** Fastify logger options; defaults to the configured level. */
  readonly logger?: FastifyServerOptions['logger'];
}

/**
 * Rocko Bishop
 * Builds a fully configured Fastify app without listening, so tests can drive it in-process with
 * `inject` and the server entry point can own the network and process lifecycle.
 */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? { level: options.config.server.logLevel },
    // Many deployments sit behind a proxy that rewrites paths; tolerate a trailing slash.
    routerOptions: { ignoreTrailingSlash: true },
  });

  await app.register(cors, {
    origin: [...options.config.cors.origins],
    methods: ['GET'],
  });

  registerErrorHandling(app);

  const services = options.createServices(app.log);
  registerHealthRoute(app);
  registerDailySummaryRoute(app, services.dailySummaries);

  return app;
}
