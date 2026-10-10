import { describe, expect, it } from 'vitest';

import {
  computeBackoffDelayMs,
  isRetryableStatus,
  parseRetryAfterMs,
} from '../../../src/infra/http/retryPolicy.js';
import { testRetryPolicy } from '../../support/http.js';

describe('isRetryableStatus', () => {
  it.each([408, 429, 500, 502, 503, 504, 599])('retries %i', (status) => {
    expect(isRetryableStatus(status)).toBe(true);
  });

  it.each([200, 301, 400, 401, 403, 404, 422])('does not retry %i', (status) => {
    expect(isRetryableStatus(status)).toBe(false);
  });
});

describe('computeBackoffDelayMs', () => {
  it('grows exponentially, scaled by jitter', () => {
    const half = (): number => 0.5;
    expect(computeBackoffDelayMs(0, testRetryPolicy, half)).toBe(50);
    expect(computeBackoffDelayMs(1, testRetryPolicy, half)).toBe(100);
    expect(computeBackoffDelayMs(2, testRetryPolicy, half)).toBe(200);
  });

  it('is capped at maxDelayMs', () => {
    expect(computeBackoffDelayMs(10, testRetryPolicy, () => 0.999)).toBeLessThanOrEqual(1_000);
  });

  it('can be zero with full jitter', () => {
    expect(computeBackoffDelayMs(3, testRetryPolicy, () => 0)).toBe(0);
  });
});

describe('parseRetryAfterMs', () => {
  it('converts seconds to milliseconds', () => {
    expect(parseRetryAfterMs('0', testRetryPolicy)).toBe(0);
    expect(parseRetryAfterMs(' 1 ', testRetryPolicy)).toBe(1_000);
  });

  it('caps the hint at maxDelayMs', () => {
    expect(parseRetryAfterMs('120', testRetryPolicy)).toBe(1_000);
  });

  it.each([null, '', 'soon', '-1', '1.5', 'Wed, 21 Oct 2026 07:28:00 GMT'])(
    'ignores unusable value %s',
    (value) => {
      expect(parseRetryAfterMs(value, testRetryPolicy)).toBeUndefined();
    },
  );
});
