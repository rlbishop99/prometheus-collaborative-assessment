import type { RequestCoalescer } from './requestCoalescer.js';

/**
 * Coalesces concurrent calls for the same key into one execution. When many users search the same
 * symbol at once while the cache is cold, Yahoo is called once instead of once per request.
 */
export class InFlightDeduper<K, V> implements RequestCoalescer<K, V> {
  private readonly inFlight = new Map<K, Promise<V>>();

  /**
   * Rocko Bishop
   * Runs `task` for `key`, or joins the run already in progress. The entry is cleared when the task
   * settles, whether it succeeds or fails, so a failure is never replayed to later callers.
   */
  run(key: K, task: () => Promise<V>): Promise<V> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }
    const execution = this.execute(key, task);
    this.inFlight.set(key, execution);
    return execution;
  }

  get size(): number {
    return this.inFlight.size;
  }

  /**
   * Rocko Bishop
   * Awaits the task and always removes the key afterwards, in `finally`. The task is started on
   * the next microtask, not inline. Otherwise a task that throws synchronously would run `finally`
   * before `run` registers the promise, leaving a permanently rejected entry behind.
   */
  private async execute(key: K, task: () => Promise<V>): Promise<V> {
    try {
      return await Promise.resolve().then(task);
    } finally {
      this.inFlight.delete(key);
    }
  }
}
