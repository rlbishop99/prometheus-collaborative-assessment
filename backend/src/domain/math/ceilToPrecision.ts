/** 10^8: values are first rounded to 8 decimals, which strips binary float noise. */
const NOISE_SCALE = 1e8;
/** 10^4: the contract's 4-decimal precision. */
const TARGET_SCALE = 1e4;

/**
 * Rocko Bishop
 * Applies the contract's rounding: round to 8 decimals, then ceil to 4. The noise step works on
 * integers so binary floating-point artifacts cannot leak into the ceiling. For example,
 * `40.0001 * 10_000` evaluates to `400001.00000000006`, which a naive ceil would turn into
 * `40.0002`.
 * @param value - A finite, non-negative price.
 */
export function ceilToPrecision(value: number): number {
  const noiseFreeUnits = Math.round(value * NOISE_SCALE);
  return Math.ceil(noiseFreeUnits / (NOISE_SCALE / TARGET_SCALE)) / TARGET_SCALE;
}
