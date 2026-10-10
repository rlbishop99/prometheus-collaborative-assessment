import type { FastifyInstance } from 'fastify';

/**
 * Rocko Bishop
 * Registers `GET /health`, a dependency-free liveness probe for load balancers and orchestrators.
 * It deliberately does not call Yahoo, so an upstream outage cannot get healthy instances
 * restarted.
 */
export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/health', () => ({ status: 'ok' }));
}
