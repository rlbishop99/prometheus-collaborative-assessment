/**
 * Rocko Bishop
 * Arithmetic mean. Throws on an empty input, because a mean of nothing is undefined and silently
 * returning NaN would corrupt downstream results.
 */
export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('Cannot compute the mean of an empty list');
  }
  return sum(values) / values.length;
}

function sum(values: readonly number[]): number {
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
 */
export function safeIntegerSum(values: readonly number[]): number {
  const total = sum(values);
  if (!Number.isSafeInteger(total)) {
    throw new RangeError(`Integer sum ${total} is outside the safe integer range`);
  }
  return total;
}
