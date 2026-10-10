const DEFAULT_DECIMALS = 4;
const DEFAULT_NOISE_DECIMALS = 8;

/**
 * Rocko Bishop
 * Ceils `value` to `decimals` places after first rounding it to `noiseDecimals` places. The
 * noise-rounding step works on integers so binary floating-point artifacts cannot leak into the
 * ceiling. For example, `40.0001 * 10_000` evaluates to `400001.00000000006`, which a naive ceil
 * would turn into `40.0002`.
 * @param value - The finite number to round.
 * @param decimals - Decimal places to ceil to (default 4).
 * @param noiseDecimals - Decimal places to round to first, to strip float noise (default 8).
 * @returns The value ceiled to `decimals` places.
 */
export function ceilToPrecision(
  value: number,
  decimals: number = DEFAULT_DECIMALS,
  noiseDecimals: number = DEFAULT_NOISE_DECIMALS,
): number {
  assertFinite(value);
  assertPrecisionArguments(decimals, noiseDecimals);

  const noiseScale = 10 ** noiseDecimals;
  const scaledForNoise = value * noiseScale;

  if (!Number.isSafeInteger(Math.round(scaledForNoise))) {
    // Magnitude too large for exact integer rounding; the noise step would itself be lossy.
    return naiveCeil(value, decimals);
  }

  const noiseFreeUnits = Math.round(scaledForNoise);
  const unitsAtTargetPrecision = noiseFreeUnits / 10 ** (noiseDecimals - decimals);
  return Math.ceil(unitsAtTargetPrecision) / 10 ** decimals;
}

/**
 * Rocko Bishop
 * Fallback ceiling without noise stripping, for values too large to scale exactly.
 * @param value - The number to ceil.
 * @param decimals - Decimal places to ceil to.
 * @returns The value ceiled to `decimals` places.
 */
function naiveCeil(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.ceil(value * scale) / scale;
}

/**
 * Rocko Bishop
 * Rejects NaN and infinities, which would otherwise propagate silently through the math.
 * @param value - The number to check.
 */
function assertFinite(value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot round a non-finite value: ${String(value)}`);
  }
}

/**
 * Rocko Bishop
 * Validates the precision arguments so that a misconfigured caller fails loudly, not with wrong
 * numbers.
 * @param decimals - Target decimal places; must be a non-negative integer.
 * @param noiseDecimals - Noise decimal places; must be an integer no smaller than `decimals`.
 */
function assertPrecisionArguments(decimals: number, noiseDecimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError(`decimals must be a non-negative integer, received ${decimals}`);
  }
  if (!Number.isInteger(noiseDecimals) || noiseDecimals < decimals) {
    throw new RangeError(
      `noiseDecimals must be an integer >= decimals (${decimals}), received ${noiseDecimals}`,
    );
  }
}
