/**
 * The request never produced an HTTP response (DNS failure, refused connection, timeout, ...)
 * on any attempt. This is kept separate from app errors so the HTTP utility stays vendor-neutral;
 * providers translate it.
 */
export class HttpTransportError extends Error {
  /**
   * Rocko Bishop
   * Wraps the last transport failure together with how many attempts were made.
   * @param attempts - Total attempts made, including the first.
   * @param cause - The final underlying error.
   */
  constructor(
    readonly attempts: number,
    cause: unknown,
  ) {
    super(`Request failed after ${attempts} attempt(s): ${describeCause(cause)}`, { cause });
    this.name = 'HttpTransportError';
  }
}

/**
 * Rocko Bishop
 * Produces a short description of an unknown thrown value for the error message.
 * @param cause - Any thrown value.
 * @returns The error's message, or its string form.
 */
function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
