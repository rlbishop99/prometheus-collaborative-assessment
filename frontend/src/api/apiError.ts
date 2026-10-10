/**
 * How a failed request should be presented:
 * - `invalidInput`: the server rejected the symbol format (400).
 * - `notFound`: the symbol does not exist upstream (404 with the symbol-not-found problem).
 * - `unreachable`: the data source cannot be reached right now (network, timeout, 502-504).
 * - `unknown`: anything else, such as a server bug or a response this client cannot read.
 */
export type ApiErrorKind = 'invalidInput' | 'notFound' | 'unreachable' | 'unknown';

/** A classified API failure. The UI branches on `kind`, never on status codes. */
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    options: { readonly cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
  }
}

/**
 * Rocko Bishop
 * Recognizes a deliberate cancellation (a superseded search, or an unmount), which callers must
 * ignore rather than report as a failure.
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
