import type { SymbolData } from './searchTypes';

export type Clock = () => number;

export interface SessionCacheOptions {
  /** Data younger than this is served without a request. */
  readonly ttlMs: number;
  /** Upper bound on remembered symbols; the oldest is evicted first. */
  readonly maxEntries: number;
  readonly clock: Clock;
}

/**
 * In-memory, per-tab record of what each symbol returned. Unlike the backend cache, entries are
 * kept after they go stale, because stale data is still what the UI retains under the
 * "unreachable" warning. Freshness only decides whether a re-search hits the network.
 */
export class SessionCache {
  private readonly entries = new Map<string, SymbolData>();

  /**
   * Rocko Bishop
   * Creates the cache, validating the options so a misconfiguration fails at startup.
   * @param options - TTL, size bound and clock.
   */
  constructor(private readonly options: SessionCacheOptions) {
    if (!Number.isInteger(options.ttlMs) || options.ttlMs <= 0) {
      throw new RangeError(`ttlMs must be a positive integer, received ${options.ttlMs}`);
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new RangeError(`maxEntries must be a positive integer, received ${options.maxEntries}`);
    }
  }

  /**
   * Rocko Bishop
   * Returns the last data seen for a symbol, fresh or not.
   * @param symbol - Normalized symbol.
   * @returns The stored data, or undefined if the symbol was never fetched this session.
   */
  get(symbol: string): SymbolData | undefined {
    return this.entries.get(symbol);
  }

  /**
   * Rocko Bishop
   * Decides whether stored data may be served without asking the server again. Data exactly
   * `ttlMs` old is stale, matching "re-query once 2+ minutes have elapsed".
   * @param data - Previously stored data.
   * @returns True while the data is younger than the TTL.
   */
  isFresh(data: SymbolData): boolean {
    return this.options.clock() - data.fetchedAt < this.options.ttlMs;
  }

  /**
   * Rocko Bishop
   * Stores a symbol's latest data. Re-inserting moves it to the newest position, so eviction
   * removes the symbol that has gone longest without a refresh.
   * @param data - The data to remember.
   */
  set(data: SymbolData): void {
    this.entries.delete(data.symbol);
    this.entries.set(data.symbol, data);
    this.evictOverflow();
  }

  /**
   * Rocko Bishop
   * Drops the oldest entries until the size bound holds.
   */
  private evictOverflow(): void {
    while (this.entries.size > this.options.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) {
        return;
      }
      this.entries.delete(oldest.value);
    }
  }
}
