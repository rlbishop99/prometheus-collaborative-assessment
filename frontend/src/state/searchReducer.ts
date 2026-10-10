import type { SearchAction, SearchState } from './searchTypes';

export const initialSearchState: SearchState = { status: 'idle' };

/**
 * Rocko Bishop
 * Pure transition function for the search state machine. Request outcomes are applied only when
 * they belong to the request currently in flight, so a slow, superseded response can never
 * overwrite a newer search.
 */
export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'inputRejected':
      return { status: 'error', failure: { kind: action.kind } };
    case 'requestStarted':
      return {
        status: 'loading',
        requestId: action.requestId,
        symbol: action.symbol,
        previous: action.previous,
      };
    case 'requestSucceeded':
      return isCurrentRequest(state, action.requestId)
        ? { status: 'success', data: action.data }
        : state;
    case 'requestFailed':
      return isCurrentRequest(state, action.requestId)
        ? { status: 'error', failure: action.failure, retained: action.retained }
        : state;
  }
}

function isCurrentRequest(state: SearchState, requestId: number): boolean {
  return state.status === 'loading' && state.requestId === requestId;
}
