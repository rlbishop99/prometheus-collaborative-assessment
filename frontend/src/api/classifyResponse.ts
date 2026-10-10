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
 * @returns The classified error (returned, not thrown, so callers decide).
 */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  const problem = await readProblemDetails(response);
  const kind = classifyStatus(response.status, problem);
  const detail = problem?.detail ?? response.statusText;
  return new ApiError(kind, `HTTP ${response.status}: ${detail}`);
}

function classifyStatus(status: number, problem: ProblemDetails | undefined): ApiErrorKind {
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
 */
async function readProblemDetails(response: Response): Promise<ProblemDetails | undefined> {
  try {
    const parsed = problemDetailsSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
