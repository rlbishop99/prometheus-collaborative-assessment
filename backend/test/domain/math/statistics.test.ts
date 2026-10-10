import { describe, expect, it } from 'vitest';

import { mean, safeIntegerSum } from '../../../src/domain/math/statistics.js';

describe('mean', () => {
  it('averages the values', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('rejects an empty list', () => {
    expect(() => mean([])).toThrow(RangeError);
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
