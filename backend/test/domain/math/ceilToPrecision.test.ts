import { describe, expect, it } from 'vitest';

import { ceilToPrecision } from '../../../src/domain/math/ceilToPrecision.js';

describe('ceilToPrecision', () => {
  it('leaves values that already have 4 decimals unchanged despite float noise', () => {
    // 40.0001 * 10_000 === 400001.00000000006 in IEEE-754; a naive ceil yields 40.0002.
    expect(Math.ceil(40.0001 * 10_000) / 10_000).toBe(40.0002);
    expect(ceilToPrecision(40.0001)).toBe(40.0001);
    expect(ceilToPrecision(40.2958)).toBe(40.2958);
  });

  it('strips accumulated noise from arithmetic results', () => {
    // (0.1 + 0.2) * 10_000 === 3000.0000000000005; a naive ceil yields 0.3001.
    expect(Math.ceil((0.1 + 0.2) * 10_000) / 10_000).toBe(0.3001);
    expect(ceilToPrecision(0.1 + 0.2)).toBe(0.3);
  });

  it('ceils any genuine remainder beyond 4 decimals', () => {
    expect(ceilToPrecision(49.75331)).toBe(49.7534);
    expect(ceilToPrecision(49.75330001)).toBe(49.7534);
  });

  it('treats remainders below the 8-decimal noise floor as noise', () => {
    expect(ceilToPrecision(49.753300001)).toBe(49.7533);
    expect(ceilToPrecision(49.753300000001)).toBe(49.7533);
  });

  it('handles integers and zero', () => {
    expect(ceilToPrecision(42)).toBe(42);
    expect(ceilToPrecision(0)).toBe(0);
  });
});
