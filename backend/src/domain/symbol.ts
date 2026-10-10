import { InvalidSymbolError } from '../errors/appErrors.js';

/**
 * Letters, digits and the punctuation real tickers use: `.` (BRK.B), `-` (BF-B), `^` (indices
 * such as ^GSPC) and `=` (futures and FX such as CL=F).
 */
const SYMBOL_PATTERN = /^[A-Z0-9.^=-]{1,15}$/;

/**
 * Rocko Bishop
 * Normalizes and validates raw user input into a canonical ticker. Doing this in one place means
 * `tsla`, ` TSLA ` and `TSLA` share a single cache entry and are validated identically, whoever
 * the caller is.
 * @param raw - Untrusted input, of any type.
 * @returns The trimmed, upper-cased symbol.
 */
export function parseSymbol(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new InvalidSymbolError('Symbol must be a string');
  }
  const symbol = raw.trim().toUpperCase();
  if (!SYMBOL_PATTERN.test(symbol)) {
    throw new InvalidSymbolError(
      'Symbol must be 1-15 characters using letters, digits, ".", "-", "^" or "="',
    );
  }
  return symbol;
}
