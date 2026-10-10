/**
 * Mirrors the backend's rule (backend/src/domain/symbol.ts): 1-15 letters, digits, `.`, `-`, `^`
 * or `=`. Validating client-side gives instant feedback and saves a round trip; the backend still
 * validates independently.
 */
const SYMBOL_PATTERN = /^[A-Z0-9.^=-]{1,15}$/;

export type SymbolInputRejection = 'empty' | 'malformed';

export type SymbolInputResult =
  | { readonly ok: true; readonly symbol: string }
  | { readonly ok: false; readonly reason: SymbolInputRejection };

/**
 * Rocko Bishop
 * Normalizes what the user typed into a canonical symbol, or explains why it cannot be one.
 * Telling empty input apart from malformed input lets the UI show the right warning for each.
 * @param raw - The text from the search field.
 * @returns The upper-cased symbol, or the rejection reason.
 */
export function parseSymbolInput(raw: string): SymbolInputResult {
  const symbol = raw.trim().toUpperCase();
  if (symbol.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (!SYMBOL_PATTERN.test(symbol)) {
    return { ok: false, reason: 'malformed' };
  }
  return { ok: true, symbol };
}
