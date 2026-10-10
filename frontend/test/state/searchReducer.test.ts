import { describe, expect, it } from 'vitest';

import { initialSearchState, searchReducer } from '../../src/state/searchReducer';
import type { SearchState, SymbolData } from '../../src/state/searchTypes';
import { tslaSummaries } from '../support/fixtures';

const tsla: SymbolData = { symbol: 'TSLA', summaries: tslaSummaries, fetchedAt: 1 };
const loading = (requestId: number): SearchState => ({
  status: 'loading',
  requestId,
  symbol: 'TSLA',
});

describe('searchReducer', () => {
  it('starts idle', () => {
    expect(initialSearchState).toEqual({ status: 'idle' });
  });

  it('enters loading when a request starts', () => {
    expect(
      searchReducer(initialSearchState, { type: 'requestStarted', requestId: 1, symbol: 'TSLA' }),
    ).toEqual(loading(1));
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

  it('serves cached data immediately', () => {
    expect(searchReducer(initialSearchState, { type: 'servedFromCache', data: tsla })).toEqual({
      status: 'success',
      data: tsla,
    });
  });
});
