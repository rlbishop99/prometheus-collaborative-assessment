import { describe, expect, it } from 'vitest';

import { mean, safeIntegerSum, sum } from '../../../src/domain/math/statistics.js';

describe('mean', () => {
  it('averages the values', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns the value itself for a single element', () => {
    expect(mean([7.5])).toBe(7.5);
  });

  it('rejects an empty list', () => {
    expect(() => mean([])).toThrow(RangeError);
  });
});

describe('sum', () => {
  it('adds the values and treats an empty list as 0', () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });
});

describe('safeIntegerSum', () => {
  it('sums integers', () => {
    expect(safeIntegerSum([49_000_000, 73_348])).toBe(49_073_348);
  });

  it('rejects totals beyond the safe integer range', () => {
    expect(() => safeIntegerSum([Number.MAX_SAFE_INTEGER, 1])).toThrow(RangeError);
  });
});
