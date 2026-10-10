/**
 * Key-value cache abstraction. It is asynchronous so that a shared store (e.g. Redis) can replace
 * the in-memory implementation when the API scales to several instances, without changing
 * callers. Expiry policy belongs to the implementation.
 */
export interface Cache<K, V> {
  get(key: K): Promise<V | undefined>;
  set(key: K, value: V): Promise<void>;
}
