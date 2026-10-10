import type { FastifyInstance } from 'fastify';

import { buildApp } from './app.js';
import { ConfigError, loadConfig } from './config/appConfig.js';
import { createAppServices } from './container.js';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const SHUTDOWN_GRACE_MS = 10_000;

/**
 * Rocko Bishop
 * Process entry point: load config, build the app, start listening, and wire graceful shutdown.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp({
    config,
    createServices: (logger) => createAppServices(config, logger),
  });
  registerGracefulShutdown(app);
  await app.listen({ host: config.server.host, port: config.server.port });
}

/**
 * Rocko Bishop
 * Closes the server on SIGINT/SIGTERM so in-flight requests finish. A timer forces the exit if
 * closing hangs, so the process cannot linger forever.
 * @param app - The running Fastify instance.
 */
function registerGracefulShutdown(app: FastifyInstance): void {
  for (const signal of SHUTDOWN_SIGNALS) {
    process.once(signal, () => {
      app.log.info({ signal }, 'Shutting down');
      const forceExit = setTimeout(() => {
        app.log.error('Graceful shutdown timed out; forcing exit');
        process.exit(1);
      }, SHUTDOWN_GRACE_MS);
      forceExit.unref();

      app.close().then(
        () => process.exit(0),
        (error: unknown) => {
          app.log.error({ err: error }, 'Error during shutdown');
          process.exit(1);
        },
      );
    });
  }
}

/**
 * Rocko Bishop
 * Reports a startup failure in a readable way and exits non-zero, so that supervisors and CI
 * notice it.
 * @param error - The error that prevented startup.
 */
function reportStartupFailure(error: unknown): void {
  const message =
    error instanceof ConfigError ? error.message : `Failed to start: ${String(error)}`;
  console.error(message);
  process.exit(1);
}

main().catch(reportStartupFailure);
