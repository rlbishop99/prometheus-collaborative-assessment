const LOCALE = 'en-US';

/** The API's contract precision is 4 decimals; prices always show all four, for aligned reading. */
const priceFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const volumeFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

export function formatVolume(value: number): string {
  return volumeFormatter.format(value);
}
