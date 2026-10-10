import { describe, expect, it } from 'vitest';

import { SessionCache } from '../../src/state/sessionCache';
import { manualClock, nvdaSummaries, tslaSummaries } from '../support/fixtures';

const TWO_MINUTES = 120_000;

describe('SessionCache', () => {
  const setup = (
    maxEntries = 10,
  ): { cache: SessionCache; time: ReturnType<typeof manualClock> } => {
    const time = manualClock();
    return { cache: new SessionCache({ ttlMs: TWO_MINUTES, maxEntries, clock: time.clock }), time };
  };

  it('returns nothing for symbols never fetched', () => {
    expect(setup().cache.get('TSLA')).toBeUndefined();
  });

  it('is fresh until just before 2 minutes, and stale at exactly 2 minutes', () => {
    const { cache, time } = setup();
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries, fetchedAt: time.clock() });
    const stored = cache.get('TSLA');
    if (!stored) throw new Error('expected stored data');

    time.advance(TWO_MINUTES - 1);
    expect(cache.isFresh(stored)).toBe(true);
    time.advance(1);
    expect(cache.isFresh(stored)).toBe(false);
  });

  it('keeps stale entries, which are retained during outages', () => {
    const { cache, time } = setup();
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries, fetchedAt: time.clock() });

    time.advance(10 * TWO_MINUTES);

    expect(cache.get('TSLA')?.summaries).toBe(tslaSummaries);
  });

  it('evicts the least recently refreshed symbol beyond the size bound', () => {
    const { cache, time } = setup(2);
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries, fetchedAt: time.clock() });
    cache.set({ symbol: 'NVDA', summaries: nvdaSummaries, fetchedAt: time.clock() });
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries, fetchedAt: time.clock() });
    cache.set({ symbol: 'AAPL', summaries: [], fetchedAt: time.clock() });

    expect(cache.get('NVDA')).toBeUndefined();
    expect(cache.get('TSLA')).toBeDefined();
    expect(cache.get('AAPL')).toBeDefined();
  });

  it.each([
    { ttlMs: 0, maxEntries: 1 },
    { ttlMs: 1, maxEntries: 0 },
    { ttlMs: 1.5, maxEntries: 1 },
  ])('rejects invalid options %o', (options) => {
    expect(() => new SessionCache({ ...options, clock: Date.now })).toThrow(RangeError);
  });
});
