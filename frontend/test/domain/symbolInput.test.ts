import { describe, expect, it } from 'vitest';

import { parseSymbolInput } from '../../src/domain/symbolInput';

describe('parseSymbolInput', () => {
  it.each([
    ['tsla', 'TSLA'],
    ['  AAPL ', 'AAPL'],
    ['brk.b', 'BRK.B'],
    ['^gspc', '^GSPC'],
    ['cl=f', 'CL=F'],
    ['BF-B', 'BF-B'],
  ])('accepts %j as %j', (raw, symbol) => {
    expect(parseSymbolInput(raw)).toEqual({ ok: true, symbol });
  });

  it.each(['', '   ', '\t\n'])('rejects blank input %j as empty', (raw) => {
    expect(parseSymbolInput(raw)).toEqual({ ok: false, reason: 'empty' });
  });

  it.each(['TS LA', 'TSLA!', 'ABCDEFGHIJKLMNOP', '<b>', 'ÄPPL', '../x'])(
    'rejects %j as malformed',
    (raw) => {
      expect(parseSymbolInput(raw)).toEqual({ ok: false, reason: 'malformed' });
    },
  );
});
