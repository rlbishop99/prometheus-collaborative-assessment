import { describe, expect, it } from 'vitest';

import { InMemoryTtlCache } from '../../../src/infra/cache/inMemoryTtlCache.js';
import { manualClock } from '../../support/clock.js';

const TWO_MINUTES = 120_000;

const createCache = (maxEntries = 10): ReturnType<typeof setup> => setup(maxEntries);

const setup = (
  maxEntries: number,
): { cache: InMemoryTtlCache<string, number>; advance: (ms: number) => void } => {
  const { clock, advance } = manualClock();
  return { cache: new InMemoryTtlCache({ ttlMs: TWO_MINUTES, maxEntries, clock }), advance };
};

describe('InMemoryTtlCache', () => {
  it('returns undefined for unknown keys', async () => {
    const { cache } = createCache();
    expect(await cache.get('TSLA')).toBeUndefined();
  });

  it('serves a stored value until just before the TTL', async () => {
    const { cache, advance } = createCache();
    await cache.set('TSLA', 1);

    advance(TWO_MINUTES - 1);

    expect(await cache.get('TSLA')).toBe(1);
  });

  it('expires the value at exactly the TTL', async () => {
    const { cache, advance } = createCache();
    await cache.set('TSLA', 1);

    advance(TWO_MINUTES);

    expect(await cache.get('TSLA')).toBeUndefined();
  });

  it('restarts the TTL when a key is overwritten', async () => {
    const { cache, advance } = createCache();
    await cache.set('TSLA', 1);
    advance(TWO_MINUTES - 1);
    await cache.set('TSLA', 2);
    advance(TWO_MINUTES - 1);

    expect(await cache.get('TSLA')).toBe(2);
  });

  it('evicts the oldest entry once the size bound is exceeded', async () => {
    const { cache } = createCache(2);
    await cache.set('A', 1);
    await cache.set('B', 2);
    await cache.set('C', 3);

    expect(await cache.get('A')).toBeUndefined();
    expect(await cache.get('B')).toBe(2);
    expect(await cache.get('C')).toBe(3);
  });

  it('treats a rewritten key as the newest for eviction', async () => {
    const { cache } = createCache(2);
    await cache.set('A', 1);
    await cache.set('B', 2);
    await cache.set('A', 10);
    await cache.set('C', 3);

    expect(await cache.get('A')).toBe(10);
    expect(await cache.get('B')).toBeUndefined();
  });
});
