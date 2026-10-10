import { describe, expect, it } from 'vitest';

import { filterValidBars } from '../../../src/domain/aggregation/filterValidBars.js';
import type { IntradayBar } from '../../../src/domain/types.js';

const validBar: IntradayBar = { timestamp: 1_791_552_600, low: 10, high: 12, volume: 100 };

describe('filterValidBars', () => {
  it('keeps complete bars', () => {
    expect(filterValidBars([validBar])).toEqual([validBar]);
  });

  it.each<[string, Partial<IntradayBar>]>([
    ['null low', { low: null }],
    ['null high', { high: null }],
    ['null volume', { volume: null }],
    ['NaN low', { low: Number.NaN }],
    ['infinite high', { high: Number.POSITIVE_INFINITY }],
    ['negative low', { low: -1 }],
    ['fractional volume', { volume: 1.5 }],
    ['negative volume', { volume: -10 }],
    ['low above high', { low: 13 }],
    ['NaN timestamp', { timestamp: Number.NaN }],
  ])('drops a bar with %s', (_label, override) => {
    expect(filterValidBars([{ ...validBar, ...override }])).toEqual([]);
  });

  it('keeps zero-volume bars and flat bars', () => {
    const flat: IntradayBar = { ...validBar, low: 10, high: 10, volume: 0 };
    expect(filterValidBars([flat])).toEqual([flat]);
  });

  it('returns an empty list for empty input', () => {
    expect(filterValidBars([])).toEqual([]);
  });
});
