import { ApiError } from './apiError';
import type { ApiErrorKind } from './apiError';
import { problemDetailsSchema } from './schemas';
import type { ProblemDetails } from './schemas';

/** Must match the backend's SymbolNotFoundError type (backend/src/errors/appErrors.ts). */
const SYMBOL_NOT_FOUND_TYPE = '/problems/symbol-not-found';
const GATEWAY_STATUSES = new Set([502, 503, 504]);

/**
 * Rocko Bishop
 * Turns a non-success response into a classified ApiError. The problem body is consulted for the
 * 404 case, so that "unknown symbol" can be told apart from "wrong URL".
 * @param response - A response whose status is not 2xx.
 * @returns The classified error (returned, not thrown, so callers decide).
 */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  const problem = await readProblemDetails(response);
  const kind = classifyStatus(response.status, problem);
  const detail = problem?.detail ?? response.statusText;
  return new ApiError(kind, `HTTP ${response.status}: ${detail}`, { status: response.status });
}

/**
 * Rocko Bishop
 * Maps an HTTP status (plus the problem type, when known) to how the UI should react.
 * @param status - HTTP status code.
 * @param problem - Parsed problem body, when the server sent one.
 * @returns The error kind.
 */
export function classifyStatus(status: number, problem: ProblemDetails | undefined): ApiErrorKind {
  if (status === 400) {
    return 'invalidInput';
  }
  if (status === 404) {
    return problem?.type === SYMBOL_NOT_FOUND_TYPE ? 'notFound' : 'unknown';
  }
  if (GATEWAY_STATUSES.has(status)) {
    return 'unreachable';
  }
  return 'unknown';
}

/**
 * Rocko Bishop
 * Best-effort parse of an RFC 7807 body. A missing, non-JSON or oddly shaped body yields
 * undefined instead of masking the original failure with a parse error.
 * @param response - The error response.
 * @returns The problem details, or undefined.
 */
export async function readProblemDetails(response: Response): Promise<ProblemDetails | undefined> {
  try {
    const parsed = problemDetailsSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
