/**
 * The minimal logging surface the core needs. It is structurally compatible with pino (Fastify's
 * logger), so the app logger can be passed straight in without the core depending on Fastify.
 */
export interface Logger {
  warn(details: Record<string, unknown>, message: string): void;
}
