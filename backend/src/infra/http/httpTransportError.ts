/**
 * The request never produced an HTTP response (DNS failure, refused connection, timeout, ...)
 * on any attempt. This is kept separate from app errors so the HTTP utility stays vendor-neutral;
 * providers translate it.
 */
export class HttpTransportError extends Error {
  constructor(
    readonly attempts: number,
    cause: unknown,
  ) {
    super(`Request failed after ${attempts} attempt(s): ${describeCause(cause)}`, { cause });
    this.name = 'HttpTransportError';
  }
}

function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
