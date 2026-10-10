import { describe, expect, it } from 'vitest';

import { joinClassNames } from '../../src/utils/joinClassNames';

describe('joinClassNames', () => {
  it('joins class names with spaces', () => {
    expect(joinClassNames('a', 'b', 'c')).toBe('a b c');
  });

  it('skips falsy entries', () => {
    expect(joinClassNames('a', undefined, false, null, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing remains', () => {
    expect(joinClassNames(undefined, false)).toBe('');
  });
});
