import type { Clock } from '../clock.js';
import { systemClock } from '../clock.js';
import type { Cache } from './cache.js';

export interface InMemoryTtlCacheOptions {
  /** Entries older than this are treated as absent. */
  readonly ttlMs: number;
  /** Upper bound on stored entries; the oldest entry is evicted first. */
  readonly maxEntries: number;
  readonly clock?: Clock;
}

interface Entry<V> {
  readonly value: V;
  readonly storedAt: number;
}

/**
 * Process-local cache with a fixed time-to-live and a bounded size. Expired entries are removed
 * lazily when read, and the size bound keeps memory flat however many distinct keys are requested.
 * Stale entries are never served.
 */
export class InMemoryTtlCache<K, V> implements Cache<K, V> {
  private readonly entries = new Map<K, Entry<V>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly clock: Clock;

  /**
   * Rocko Bishop
   * Creates the cache, rejecting nonsensical options up front instead of misbehaving later.
   * @param options - TTL, size bound and optional clock.
   */
  constructor(options: InMemoryTtlCacheOptions) {
    assertPositiveInteger('ttlMs', options.ttlMs);
    assertPositiveInteger('maxEntries', options.maxEntries);
    this.ttlMs = options.ttlMs;
    this.maxEntries = options.maxEntries;
    this.clock = options.clock ?? systemClock;
  }

  /**
   * Rocko Bishop
   * Returns a live entry, and evicts it if it has expired.
   * @param key - The cache key.
   * @returns The cached value, or undefined when it is absent or expired.
   */
  get(key: K): Promise<V | undefined> {
    const entry = this.entries.get(key);
    if (!entry) {
      return Promise.resolve(undefined);
    }
    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return Promise.resolve(undefined);
    }
    return Promise.resolve(entry.value);
  }

  /**
   * Rocko Bishop
   * Stores a value with a fresh TTL. Re-inserting moves the key to the newest position, so
   * eviction always removes the least recently written entry.
   * @param key - The cache key.
   * @param value - The value to store.
   */
  set(key: K, value: V): Promise<void> {
    this.entries.delete(key);
    this.entries.set(key, { value, storedAt: this.clock() });
    this.evictOverflow();
    return Promise.resolve();
  }

  /**
   * Rocko Bishop
   * Tells whether an entry has outlived the TTL. An entry exactly `ttlMs` old is already expired,
   * which matches "re-query once 2+ minutes have elapsed".
   * @param entry - The stored entry.
   * @returns True when the entry must not be served.
   */
  private isExpired(entry: Entry<V>): boolean {
    return this.clock() - entry.storedAt >= this.ttlMs;
  }

  /**
   * Rocko Bishop
   * Drops the oldest entries until the size bound holds. Map iteration order is insertion order,
   * so the first key is always the oldest.
   */
  private evictOverflow(): void {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next();
      if (oldestKey.done) {
        return;
      }
      this.entries.delete(oldestKey.value);
    }
  }
}

/**
 * Rocko Bishop
 * Validates numeric options that must be positive integers.
 * @param name - Option name, used in the error message.
 * @param value - The value to check.
 */
function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer, received ${value}`);
  }
}
