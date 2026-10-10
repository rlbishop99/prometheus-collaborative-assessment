import { describe, expect, it } from 'vitest';

import type { SymbolData } from '../../src/state/searchTypes';
import { selectDisplay } from '../../src/state/selectDisplay';
import { tslaSummaries } from '../support/fixtures';

const tsla: SymbolData = { symbol: 'TSLA', summaries: tslaSummaries };

describe('selectDisplay', () => {
  it('shows placeholders before any search', () => {
    expect(selectDisplay({ status: 'idle' })).toEqual({ loading: false });
  });

  it('shows placeholders while loading a symbol with no earlier data', () => {
    expect(selectDisplay({ status: 'loading', requestId: 1, symbol: 'TSLA' })).toEqual({
      data: undefined,
      loading: true,
    });
  });

  it("keeps showing the symbol's earlier data while it reloads", () => {
    expect(
      selectDisplay({ status: 'loading', requestId: 2, symbol: 'TSLA', previous: tsla }),
    ).toEqual({ data: tsla, loading: true });
  });

  it('shows data on success', () => {
    expect(selectDisplay({ status: 'success', data: tsla })).toEqual({
      data: tsla,
      loading: false,
    });
  });

  it('warns when a valid symbol returned no trading days', () => {
    const empty = { ...tsla, summaries: [] };
    expect(selectDisplay({ status: 'success', data: empty })).toEqual({
      data: empty,
      warning: { kind: 'noData', symbol: 'TSLA' },
      loading: false,
    });
  });

  it('keeps retained data alongside the warning', () => {
    expect(
      selectDisplay({
        status: 'error',
        failure: { kind: 'unreachable', symbol: 'TSLA' },
        retained: tsla,
      }),
    ).toEqual({ data: tsla, warning: { kind: 'unreachable', symbol: 'TSLA' }, loading: false });
  });

  it('shows only the warning when nothing is retained', () => {
    expect(selectDisplay({ status: 'error', failure: { kind: 'malformedInput' } })).toEqual({
      data: undefined,
      warning: { kind: 'malformedInput' },
      loading: false,
    });
  });
});
