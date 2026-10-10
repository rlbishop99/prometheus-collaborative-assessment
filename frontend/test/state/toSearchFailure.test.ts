import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/api/apiError';
import { shouldRetainData, toSearchFailure } from '../../src/state/toSearchFailure';

describe('toSearchFailure', () => {
  it.each([
    ['invalidInput', 'malformedInput'],
    ['notFound', 'notFound'],
    ['unreachable', 'unreachable'],
    ['unknown', 'unknown'],
  ] as const)('maps ApiError %s to %s', (apiKind, kind) => {
    expect(toSearchFailure(new ApiError(apiKind, 'x'), 'TSLA')).toEqual({ kind, symbol: 'TSLA' });
  });

  it('treats unclassified errors as unknown', () => {
    expect(toSearchFailure(new Error('bug'), 'TSLA')).toEqual({ kind: 'unknown', symbol: 'TSLA' });
    expect(toSearchFailure('thrown string', 'TSLA').kind).toBe('unknown');
  });
});

describe('shouldRetainData', () => {
  it.each([
    ['unreachable', true],
    ['unknown', true],
    ['notFound', false],
    ['malformedInput', false],
    ['emptyInput', false],
  ] as const)('%s -> %s', (kind, expected) => {
    expect(shouldRetainData({ kind })).toBe(expected);
  });
});
