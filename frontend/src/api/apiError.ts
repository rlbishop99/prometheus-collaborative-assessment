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
  readonly status: number | undefined;

  /**
   * Rocko Bishop
   * Creates a classified API error, keeping the underlying cause for debugging.
   * @param kind - How the failure should be presented.
   * @param message - Developer-facing description (not shown to users).
   * @param options - Optional `cause` and HTTP `status`.
   */
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    options: { readonly cause?: unknown; readonly status?: number } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
  }
}

/**
 * Rocko Bishop
 * Recognizes a deliberate cancellation (a superseded search, or an unmount), which callers must
 * ignore rather than report as a failure.
 * @param error - Any thrown value.
 * @returns True for an AbortError.
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
