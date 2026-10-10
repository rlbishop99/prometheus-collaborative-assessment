import { describe, expect, it } from 'vitest';

import { parseSymbol } from '../../src/domain/symbol.js';
import { InvalidSymbolError } from '../../src/errors/appErrors.js';

describe('parseSymbol', () => {
  it.each([
    ['TSLA', 'TSLA'],
    ['tsla', 'TSLA'],
    ['  aapl  ', 'AAPL'],
    ['brk.b', 'BRK.B'],
    ['BF-B', 'BF-B'],
    ['^gspc', '^GSPC'],
    ['cl=f', 'CL=F'],
    ['A', 'A'],
    ['ABCDEFGHIJKLMNO', 'ABCDEFGHIJKLMNO'],
  ])('normalizes %j to %j', (raw, expected) => {
    expect(parseSymbol(raw)).toBe(expected);
  });

  it.each(['', '   ', 'ABCDEFGHIJKLMNOP', 'TS LA', 'TSLA!', 'TSLA/../x', '<script>', 'ÄPPL'])(
    'rejects %j',
    (raw) => {
      expect(() => parseSymbol(raw)).toThrow(InvalidSymbolError);
    },
  );

  it.each([undefined, null, 42, ['TSLA'], { symbol: 'TSLA' }])('rejects non-string %j', (raw) => {
    expect(() => parseSymbol(raw)).toThrow(InvalidSymbolError);
  });
});
