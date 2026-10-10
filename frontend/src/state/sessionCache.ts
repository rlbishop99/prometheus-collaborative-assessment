import type { SymbolData } from './searchTypes';

export interface SessionCacheOptions {
  /** Upper bound on remembered symbols; the oldest is evicted first. */
  readonly maxEntries: number;
}

/**
 * In-memory, per-tab record of each symbol's last good data. It never decides freshness: every
 * search asks the API, whose 2-minute cache is the single source of the freshness rule (a second
 * TTL here would stack with it and let data age up to 4 minutes). This record is what the UI shows
 * while a symbol reloads and keeps under the "unreachable" warning.
 */
export class SessionCache {
  private readonly entries = new Map<string, SymbolData>();

  constructor(private readonly options: SessionCacheOptions) {}

  get(symbol: string): SymbolData | undefined {
    return this.entries.get(symbol);
  }

  /**
   * Rocko Bishop
   * Stores a symbol's latest data. Re-inserting moves it to the newest position, so eviction
   * removes the symbol that has gone longest without a refresh.
   */
  set(data: SymbolData): void {
    this.entries.delete(data.symbol);
    this.entries.set(data.symbol, data);
    this.evictOverflow();
  }

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
