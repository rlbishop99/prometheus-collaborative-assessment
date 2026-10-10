export const APP_NAME = 'Symbol Tracker';

export function documentTitleFor(symbol: string | undefined): string {
  return symbol ? `${symbol} · ${APP_NAME}` : APP_NAME;
}
