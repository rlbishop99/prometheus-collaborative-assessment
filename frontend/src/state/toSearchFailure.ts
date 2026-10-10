import { ApiError } from '../api/apiError';
import type { SearchFailure, SearchFailureKind } from './searchTypes';

/**
 * Rocko Bishop
 * Converts anything a request threw into a SearchFailure. Unclassified errors, which would be
 * programming bugs, become `unknown` rather than escaping as an unhandled rejection.
 * @param error - The thrown value.
 * @param symbol - The symbol being searched.
 * @returns The failure to show.
 */
export function toSearchFailure(error: unknown, symbol: string): SearchFailure {
  const kind: SearchFailureKind = error instanceof ApiError ? fromApiKind(error.kind) : 'unknown';
  return { kind, symbol };
}

/**
 * Rocko Bishop
 * Decides whether a failure should keep the symbol's last good data on screen. That applies when
 * the API "is not serving proper data" (unreachable or unknown), but not when the symbol itself is
 * wrong.
 * @param failure - The failure.
 * @returns True when retained data should stay visible.
 */
export function shouldRetainData(failure: SearchFailure): boolean {
  return failure.kind === 'unreachable' || failure.kind === 'unknown';
}

/**
 * Rocko Bishop
 * Maps API error kinds to UI failure kinds, folding the server's 400 into `malformedInput`.
 * @param kind - The API error kind.
 * @returns The UI failure kind.
 */
function fromApiKind(kind: ApiError['kind']): SearchFailureKind {
  return kind === 'invalidInput' ? 'malformedInput' : kind;
}
