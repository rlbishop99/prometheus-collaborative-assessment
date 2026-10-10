import { describe, expect, it } from 'vitest';

import { SessionCache } from '../../src/state/sessionCache';
import { nvdaSummaries, tslaSummaries } from '../support/fixtures';

describe('SessionCache', () => {
  it('returns nothing for symbols never fetched', () => {
    expect(new SessionCache({ maxEntries: 10 }).get('TSLA')).toBeUndefined();
  });

  it("returns a symbol's last stored data", () => {
    const cache = new SessionCache({ maxEntries: 10 });
    cache.set({ symbol: 'TSLA', summaries: nvdaSummaries });
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries });

    expect(cache.get('TSLA')?.summaries).toBe(tslaSummaries);
  });

  it('evicts the least recently refreshed symbol beyond the size bound', () => {
    const cache = new SessionCache({ maxEntries: 2 });
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries });
    cache.set({ symbol: 'NVDA', summaries: nvdaSummaries });
    cache.set({ symbol: 'TSLA', summaries: tslaSummaries });
    cache.set({ symbol: 'AAPL', summaries: [] });

    expect(cache.get('NVDA')).toBeUndefined();
    expect(cache.get('TSLA')).toBeDefined();
    expect(cache.get('AAPL')).toBeDefined();
  });
});
