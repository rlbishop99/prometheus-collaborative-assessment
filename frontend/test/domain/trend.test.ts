import { describe, expect, it } from 'vitest';

import { computeTrend } from '../../src/domain/trend';

describe('computeTrend', () => {
  it.each([
    [110, 100, 'up'],
    [90, 100, 'down'],
    [100, 100, 'neutral'],
    [101, 100, 'neutral'], // exactly +1% is "within 1%"
    [99, 100, 'neutral'], // exactly -1%
    [101.01, 100, 'up'],
    [98.99, 100, 'down'],
  ] as const)('%d vs latest %d -> %s', (selected, latest, trend) => {
    expect(computeTrend(selected, latest)).toBe(trend);
  });

  it('uses the selected value relative to the latest, matching the spec direction', () => {
    // A past day with higher volume than today shows the green arrow.
    expect(computeTrend(4_625_111, 3_000_000)).toBe('up');
  });

  it('falls back to a plain comparison against a zero baseline', () => {
    expect(computeTrend(5, 0)).toBe('up');
    expect(computeTrend(0, 0)).toBe('neutral');
  });

  it('treats non-finite input as neutral instead of guessing', () => {
    expect(computeTrend(Number.NaN, 100)).toBe('neutral');
    expect(computeTrend(100, Number.POSITIVE_INFINITY)).toBe('neutral');
  });
});
