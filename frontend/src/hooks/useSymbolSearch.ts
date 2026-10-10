import { useCallback, useEffect, useReducer, useRef } from 'react';

import { isAbortError } from '../api/apiError';
import type { DailySummaryClient } from '../api/dailySummaryClient';
import { parseSymbolInput } from '../domain/symbolInput';
import type { SymbolInputRejection } from '../domain/symbolInput';
import { initialSearchState, searchReducer } from '../state/searchReducer';
import type { InputFailureKind, SearchAction, SearchState } from '../state/searchTypes';
import type { SessionCache } from '../state/sessionCache';
import { shouldRetainData, toSearchFailure } from '../state/toSearchFailure';

/** Collaborators are injected, so the hook is testable without a network. */
export interface SymbolSearchDeps {
  readonly client: DailySummaryClient;
  readonly cache: SessionCache;
}

export interface SymbolSearch {
  readonly state: SearchState;
  /**
   * Starts a search for the raw input. Returns false when it was ignored because the same symbol
   * is already loading; any other input replaces the running search.
   */
  readonly search: (rawInput: string) => boolean;
}

interface InFlightSearch {
  readonly symbol: string;
  readonly controller: AbortController;
}

/**
 * Rocko Bishop
 * Owns the search lifecycle: validate the input, fetch, remember successes, and on failure keep
 * the symbol's last good data when appropriate. Freshness is the API's job, so every valid search
 * makes a request. A repeat of the symbol already loading is ignored; anything else, including
 * rejected input, cancels the running request so its late answer can never land.
 */
export function useSymbolSearch(deps: SymbolSearchDeps): SymbolSearch {
  const { client, cache } = deps;
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  const inFlight = useRef<InFlightSearch | null>(null);
  const nextRequestId = useRef(0);

  useEffect(
    () => () => {
      inFlight.current?.controller.abort();
    },
    [],
  );

  const search = useCallback(
    (rawInput: string): boolean => {
      const parsed = parseSymbolInput(rawInput);
      if (parsed.ok && parsed.symbol === inFlight.current?.symbol) {
        return false;
      }

      inFlight.current?.controller.abort();
      inFlight.current = null;
      if (!parsed.ok) {
        dispatch({ type: 'inputRejected', kind: toInputFailureKind(parsed.reason) });
        return true;
      }

      const current: InFlightSearch = { symbol: parsed.symbol, controller: new AbortController() };
      inFlight.current = current;
      nextRequestId.current += 1;

      void runRequest({
        requestId: nextRequestId.current,
        symbol: parsed.symbol,
        signal: current.controller.signal,
        deps: { client, cache },
        dispatch,
      }).finally(() => {
        if (inFlight.current === current) {
          inFlight.current = null;
        }
      });
      return true;
    },
    [client, cache],
  );

  return { state, search };
}

interface RequestContext {
  readonly requestId: number;
  readonly symbol: string;
  readonly signal: AbortSignal;
  readonly deps: SymbolSearchDeps;
  readonly dispatch: (action: SearchAction) => void;
}

/**
 * Rocko Bishop
 * Executes one network search and reports its outcome. The symbol's last good data is shown while
 * it loads, so the cells never blank out during a re-search. Kept outside the hook so the hook
 * only coordinates, and so every branch (success, cancellation, failure) is handled in one place.
 */
async function runRequest(context: RequestContext): Promise<void> {
  const { requestId, symbol, signal, deps, dispatch } = context;
  dispatch({ type: 'requestStarted', requestId, symbol, previous: deps.cache.get(symbol) });
  try {
    const summaries = await deps.client.fetchDailySummaries(symbol, signal);
    const data = { symbol, summaries };
    deps.cache.set(data);
    dispatch({ type: 'requestSucceeded', requestId, data });
  } catch (error) {
    if (signal.aborted || isAbortError(error)) {
      return;
    }
    const failure = toSearchFailure(error, symbol);
    const retained = shouldRetainData(failure) ? deps.cache.get(symbol) : undefined;
    dispatch({ type: 'requestFailed', requestId, failure, retained });
  }
}

function toInputFailureKind(reason: SymbolInputRejection): InputFailureKind {
  return reason === 'empty' ? 'emptyInput' : 'malformedInput';
}
