export const APP_NAME = 'Symbol Tracker';

/**
 * Rocko Bishop
 * Builds the browser tab title: the viewed symbol first (what users scan tabs for), then the app.
 * @param symbol - The symbol on screen, if any.
 * @returns e.g. "TSLA · Symbol Tracker", or just the app name.
 */
export function documentTitleFor(symbol: string | undefined): string {
  return symbol ? `${symbol} · ${APP_NAME}` : APP_NAME;
}
