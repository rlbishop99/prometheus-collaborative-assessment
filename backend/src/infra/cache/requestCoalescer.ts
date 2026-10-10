/**
 * Shares one execution among concurrent calls for the same key. An abstraction like `Cache`, so a
 * distributed lock could replace the in-process implementation without changing callers.
 */
export interface RequestCoalescer<K, V> {
  run(key: K, task: () => Promise<V>): Promise<V>;
}
