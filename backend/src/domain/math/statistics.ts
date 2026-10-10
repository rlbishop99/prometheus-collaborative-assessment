/**
 * Rocko Bishop
 * Arithmetic mean. Throws on an empty input, because a mean of nothing is undefined and silently
 * returning NaN would corrupt downstream results.
 * @param values - The numbers to average; must not be empty.
 * @returns The arithmetic mean of `values`.
 */
export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('Cannot compute the mean of an empty list');
  }
  return sum(values) / values.length;
}

/**
 * Rocko Bishop
 * Adds the values with a plain loop, which avoids the intermediate allocations of `reduce`
 * callbacks on large inputs.
 * @param values - The numbers to add.
 * @returns The total; an empty input sums to 0.
 */
export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

/**
 * Rocko Bishop
 * Sums integer values and guarantees the total is still exact, which protects volume totals from
 * precision loss.
 * @param values - The integers to add.
 * @returns The exact integer total.
 */
export function safeIntegerSum(values: readonly number[]): number {
  const total = sum(values);
  if (!Number.isSafeInteger(total)) {
    throw new RangeError(`Integer sum ${total} is outside the safe integer range`);
  }
  return total;
}
