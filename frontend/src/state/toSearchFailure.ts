import { ApiError } from '../api/apiError';
import type { SearchFailure, SearchFailureKind } from './searchTypes';

/**
 * Rocko Bishop
 * Converts anything a request threw into a SearchFailure. Unclassified errors, which would be
 * programming bugs, become `unknown` rather than escaping as an unhandled rejection.
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
 */
export function shouldRetainData(failure: SearchFailure): boolean {
  return failure.kind === 'unreachable' || failure.kind === 'unknown';
}

/**
 * Rocko Bishop
 * Decides whether a failure is about what the user typed, in which case the input itself is
 * flagged invalid and linked to the message, not only the banner.
 */
export function isInputFailure(failure: SearchFailure): boolean {
  return (
    failure.kind === 'emptyInput' ||
    failure.kind === 'malformedInput' ||
    failure.kind === 'notFound'
  );
}

function fromApiKind(kind: ApiError['kind']): SearchFailureKind {
  return kind === 'invalidInput' ? 'malformedInput' : kind;
}
