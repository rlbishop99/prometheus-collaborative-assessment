import { describe, expect, it, vi } from 'vitest';

import { InFlightDeduper } from '../../../src/infra/cache/inFlightDeduper.js';

/** A promise the test resolves or rejects by hand. */
const deferred = <T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
} => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('InFlightDeduper', () => {
  it('runs the task once for concurrent calls with the same key', async () => {
    const deduper = new InFlightDeduper<string, number>();
    const gate = deferred<number>();
    const task = vi.fn(() => gate.promise);

    const first = deduper.run('TSLA', task);
    const second = deduper.run('TSLA', task);
    gate.resolve(42);

    expect(await Promise.all([first, second])).toEqual([42, 42]);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('runs separately for different keys', async () => {
    const deduper = new InFlightDeduper<string, string>();
    const task = vi.fn((value: string) => Promise.resolve(value));

    const results = await Promise.all([
      deduper.run('TSLA', () => task('TSLA')),
      deduper.run('AAPL', () => task('AAPL')),
    ]);

    expect(results).toEqual(['TSLA', 'AAPL']);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('starts a new execution after the previous one settles', async () => {
    const deduper = new InFlightDeduper<string, number>();
    const task = vi.fn(() => Promise.resolve(1));

    await deduper.run('TSLA', task);
    await deduper.run('TSLA', task);

    expect(task).toHaveBeenCalledTimes(2);
    expect(deduper.size).toBe(0);
  });

  it('shares a rejection with every waiter, then clears it so it is not replayed', async () => {
    const deduper = new InFlightDeduper<string, number>();
    const gate = deferred<number>();

    const first = deduper.run('TSLA', () => gate.promise);
    const second = deduper.run('TSLA', () => gate.promise);
    gate.reject(new Error('upstream down'));

    await expect(first).rejects.toThrow('upstream down');
    await expect(second).rejects.toThrow('upstream down');
    expect(deduper.size).toBe(0);
    await expect(deduper.run('TSLA', () => Promise.resolve(7))).resolves.toBe(7);
  });

  it('clears the key when the task throws synchronously', async () => {
    const deduper = new InFlightDeduper<string, number>();

    await expect(
      deduper.run('TSLA', () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(deduper.size).toBe(0);
  });
});
