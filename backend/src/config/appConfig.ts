import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

/**
 * The rolling window is fixed by the agreed spec and the UI copy ("in the last 30 days"), so it is
 * a constant, not an environment variable. Two extra days are fetched because the exchange
 * timezone is only known once Yahoo responds; bars are trimmed to the exact window afterwards.
 */
export const WINDOW_DAYS = 30;
export const FETCH_BUFFER_DAYS = 2;

const DEFAULT_YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const integer = (
  fallback: number,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): z.ZodDefault<z.ZodCoercedNumber> => z.coerce.number().int().min(min).max(max).default(fallback);

/** Every tunable, read from environment variables. Each has a production-safe default. */
const envSchema = z.object({
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: integer(3000, 0, 65_535),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  YAHOO_BASE_URL: z.url().default(DEFAULT_YAHOO_BASE_URL),
  YAHOO_USER_AGENT: z.string().min(1).default(DEFAULT_USER_AGENT),
  UPSTREAM_TIMEOUT_MS: integer(5_000, 100, 60_000),
  UPSTREAM_MAX_RETRIES: integer(2, 0, 5),
  UPSTREAM_RETRY_BASE_DELAY_MS: integer(200, 0, 10_000),
  UPSTREAM_RETRY_MAX_DELAY_MS: integer(2_000, 0, 30_000),
  CACHE_TTL_MS: integer(120_000, 1),
  CACHE_MAX_ENTRIES: integer(500, 1, 100_000),
});

export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfig {
  readonly server: { readonly host: string; readonly port: number; readonly logLevel: LogLevel };
  readonly cors: { readonly origins: readonly string[] };
  readonly yahoo: {
    readonly baseUrl: string;
    readonly userAgent: string;
    readonly timeoutMs: number;
    readonly retryPolicy: {
      readonly maxRetries: number;
      readonly baseDelayMs: number;
      readonly maxDelayMs: number;
    };
  };
  readonly cache: { readonly ttlMs: number; readonly maxEntries: number };
  readonly window: { readonly windowDays: number; readonly fetchBufferDays: number };
}

/** Raised at startup when the environment is invalid, listing every offending variable. */
export class ConfigError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid configuration:\n  ${issues.join('\n  ')}`);
    this.name = 'ConfigError';
  }
}

/**
 * Rocko Bishop
 * Parses and validates the environment into a typed config. The app fails fast at startup
 * with a precise message, instead of misbehaving at request time on a bad value.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(withoutBlankValues(env));
  if (!parsed.success) {
    throw new ConfigError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  const vars = parsed.data;
  if (vars.UPSTREAM_RETRY_BASE_DELAY_MS > vars.UPSTREAM_RETRY_MAX_DELAY_MS) {
    throw new ConfigError([
      'UPSTREAM_RETRY_BASE_DELAY_MS: must not exceed UPSTREAM_RETRY_MAX_DELAY_MS',
    ]);
  }
  return toAppConfig(vars);
}

function toAppConfig(vars: z.infer<typeof envSchema>): AppConfig {
  return {
    server: { host: vars.HOST, port: vars.PORT, logLevel: vars.LOG_LEVEL },
    cors: { origins: parseOriginList(vars.CORS_ORIGINS) },
    yahoo: {
      baseUrl: vars.YAHOO_BASE_URL,
      userAgent: vars.YAHOO_USER_AGENT,
      timeoutMs: vars.UPSTREAM_TIMEOUT_MS,
      retryPolicy: {
        maxRetries: vars.UPSTREAM_MAX_RETRIES,
        baseDelayMs: vars.UPSTREAM_RETRY_BASE_DELAY_MS,
        maxDelayMs: vars.UPSTREAM_RETRY_MAX_DELAY_MS,
      },
    },
    cache: { ttlMs: vars.CACHE_TTL_MS, maxEntries: vars.CACHE_MAX_ENTRIES },
    window: { windowDays: WINDOW_DAYS, fetchBufferDays: FETCH_BUFFER_DAYS },
  };
}

function parseOriginList(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Rocko Bishop
 * Treats empty variables (e.g. `PORT=`) as unset, so that they fall back to defaults instead of
 * failing coercion.
 */
function withoutBlankValues(env: NodeJS.ProcessEnv): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && value.trim() !== '') {
      result[key] = value;
    }
  }
  return result;
}
