/** Options accepted by every application error. */
export interface AppErrorOptions {
  readonly cause?: unknown;
}

/**
 * Base class for errors that map to a well-defined HTTP problem. Each subclass fixes its status,
 * RFC 7807 `type` and `title`, so the HTTP layer can translate errors without branching on them.
 */
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly type: string;
  abstract readonly title: string;

  constructor(detail: string, options: AppErrorOptions = {}) {
    super(detail, { cause: options.cause });
    this.name = new.target.name;
  }

  /**
   * Rocko Bishop
   * The `detail` sent to API clients. By default it is the message, which for client errors only
   * describes the caller's own input. Upstream errors override it with fixed text, so vendor
   * internals (schema issues, Yahoo's error codes, raw statuses) stay in the logs.
   */
  get publicDetail(): string {
    return this.message;
  }
}

/** The client sent a symbol that is not syntactically valid. */
export class InvalidSymbolError extends AppError {
  readonly status = 400;
  readonly type = '/problems/invalid-symbol';
  readonly title = 'Invalid symbol';
}

/** The upstream provider has no instrument with the requested symbol. */
export class SymbolNotFoundError extends AppError {
  readonly status = 404;
  readonly type = '/problems/symbol-not-found';
  readonly title = 'Symbol not found';
}

/** The upstream provider responded, but with a payload this service cannot use. */
export class UpstreamResponseError extends AppError {
  readonly status = 502;
  readonly type = '/problems/upstream-bad-response';
  readonly title = 'Upstream returned an invalid response';

  override get publicDetail(): string {
    return 'The market data provider returned data this service could not use. Please try again later.';
  }
}

/** The upstream provider could not be reached, timed out, or kept failing after retries. */
export class UpstreamUnavailableError extends AppError {
  readonly status = 503;
  readonly type = '/problems/upstream-unavailable';
  readonly title = 'Upstream data provider unavailable';

  override get publicDetail(): string {
    return 'The market data provider could not be reached. Please try again later.';
  }
}
