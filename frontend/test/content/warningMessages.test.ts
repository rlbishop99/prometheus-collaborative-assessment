import { describe, expect, it } from 'vitest';

import { UNREACHABLE_MESSAGE, warningMessageFor } from '../../src/content/warningMessages';

describe('warningMessageFor', () => {
  it('uses the agreed outage wording verbatim', () => {
    expect(UNREACHABLE_MESSAGE).toBe('Error: Symbol API currently unreachable');
    expect(warningMessageFor({ kind: 'unreachable', symbol: 'TSLA' })).toBe(UNREACHABLE_MESSAGE);
  });

  it.each([
    [{ kind: 'emptyInput' }, 'No input found. Please enter a valid Stock Symbol to search.'],
    [{ kind: 'malformedInput' }, 'Invalid input found. Symbols use 1-15 letters, digits, or .-^=.'],
    [
      { kind: 'notFound', symbol: 'ZZZZ' },
      "No results found for ZZZZ. Check the Symbol's spelling and try again.",
    ],
    [{ kind: 'unknown' }, 'Oops! Something went wrong while processing data. Please try again.'],
  ] as const)('uses the approved wording for %o', (failure, message) => {
    expect(warningMessageFor(failure)).toBe(message);
  });

  it('still reads naturally if the symbol is unavailable', () => {
    expect(warningMessageFor({ kind: 'notFound' })).toBe(
      "No results found for that symbol. Check the Symbol's spelling and try again.",
    );
  });
});
