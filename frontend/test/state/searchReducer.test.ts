import { describe, expect, it } from 'vitest';

import { initialSearchState, searchReducer } from '../../src/state/searchReducer';
import type { SearchState, SymbolData } from '../../src/state/searchTypes';
import { tslaSummaries } from '../support/fixtures';

const tsla: SymbolData = { symbol: 'TSLA', summaries: tslaSummaries };
const loading = (requestId: number): SearchState => ({
  status: 'loading',
  requestId,
  symbol: 'TSLA',
});

describe('searchReducer', () => {
  it('enters loading when a request starts', () => {
    expect(
      searchReducer(initialSearchState, { type: 'requestStarted', requestId: 1, symbol: 'TSLA' }),
    ).toEqual(loading(1));
  });

  it("carries the symbol's earlier data into loading", () => {
    expect(
      searchReducer(
        { status: 'success', data: tsla },
        { type: 'requestStarted', requestId: 2, symbol: 'TSLA', previous: tsla },
      ),
    ).toEqual({ ...loading(2), previous: tsla });
  });

  it('applies the outcome of the current request', () => {
    expect(
      searchReducer(loading(1), { type: 'requestSucceeded', requestId: 1, data: tsla }),
    ).toEqual({ status: 'success', data: tsla });
    expect(
      searchReducer(loading(1), {
        type: 'requestFailed',
        requestId: 1,
        failure: { kind: 'unreachable', symbol: 'TSLA' },
        retained: tsla,
      }),
    ).toEqual({
      status: 'error',
      failure: { kind: 'unreachable', symbol: 'TSLA' },
      retained: tsla,
    });
  });

  it('ignores outcomes from superseded requests', () => {
    const state = loading(2);

    expect(searchReducer(state, { type: 'requestSucceeded', requestId: 1, data: tsla })).toBe(
      state,
    );
    expect(
      searchReducer(state, {
        type: 'requestFailed',
        requestId: 1,
        failure: { kind: 'unknown', symbol: 'TSLA' },
      }),
    ).toBe(state);
  });

  it('ignores late outcomes once nothing is loading', () => {
    const state: SearchState = { status: 'success', data: tsla };

    expect(searchReducer(state, { type: 'requestSucceeded', requestId: 1, data: tsla })).toBe(
      state,
    );
  });

  it('reports rejected input without data', () => {
    expect(searchReducer(loading(1), { type: 'inputRejected', kind: 'emptyInput' })).toEqual({
      status: 'error',
      failure: { kind: 'emptyInput' },
    });
  });
});
