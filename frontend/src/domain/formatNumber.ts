const LOCALE = 'en-US';

/** The API's contract precision is 4 decimals; prices always show all four, for aligned reading. */
const priceFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const volumeFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/**
 * Rocko Bishop
 * Formats an average price with thousands separators and exactly 4 decimals, e.g. `1,234.5000`.
 * The value already has 4-decimal precision from the API, so nothing is rounded here.
 * @param value - The price.
 * @returns The display string.
 */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/**
 * Rocko Bishop
 * Formats a share volume with thousands separators, e.g. `49,073,348`.
 * @param value - The volume.
 * @returns The display string.
 */
export function formatVolume(value: number): string {
  return volumeFormatter.format(value);
}
