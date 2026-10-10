import { useCallback, useEffect, useReducer, useRef } from 'react';

import { isAbortError } from '../api/apiError';
import type { DailySummaryClient } from '../api/dailySummaryClient';
import { parseSymbolInput } from '../domain/symbolInput';
import { initialSearchState, searchReducer } from '../state/searchReducer';
import type { SearchAction, SearchState } from '../state/searchTypes';
import type { Clock, SessionCache } from '../state/sessionCache';
import { shouldRetainData, toSearchFailure } from '../state/toSearchFailure';

/** Collaborators are injected, so the hook is testable without a network or real time. */
export interface SymbolSearchDeps {
  readonly client: DailySummaryClient;
  readonly cache: SessionCache;
  readonly clock: Clock;
}

export interface SymbolSearch {
  readonly state: SearchState;
  /** Starts a search for the raw input; safe to call repeatedly. */
  readonly search: (rawInput: string) => void;
}

/**
 * Rocko Bishop
 * Owns the search lifecycle: validate the input, serve fresh session data without a request,
 * otherwise fetch (cancelling any superseded request), cache successes, and on failure keep the
 * symbol's last good data when appropriate.
 * @param deps - API client, session cache and clock.
 * @returns The current state and a `search` function.
 */
export function useSymbolSearch(deps: SymbolSearchDeps): SymbolSearch {
  const { client, cache, clock } = deps;
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  const inFlight = useRef<AbortController | null>(null);
  const nextRequestId = useRef(0);

  useEffect(
    () => () => {
      inFlight.current?.abort();
    },
    [],
  );

  const search = useCallback(
    (rawInput: string) => {
      const parsed = parseSymbolInput(rawInput);
      if (!parsed.ok) {
        dispatch({ type: 'inputRejected', kind: toInputFailureKind(parsed.reason) });
        return;
      }

      const cached = cache.get(parsed.symbol);
      if (cached && cache.isFresh(cached)) {
        inFlight.current?.abort();
        dispatch({ type: 'servedFromCache', data: cached });
        return;
      }

      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      nextRequestId.current += 1;

      void runRequest({
        requestId: nextRequestId.current,
        symbol: parsed.symbol,
        signal: controller.signal,
        deps: { client, cache, clock },
        dispatch,
      });
    },
    [client, cache, clock],
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
 * Executes one network search and reports its outcome. Kept outside the hook so the hook only
 * coordinates, and so every branch (success, cancellation, failure) is handled in one place.
 * @param context - Request id, symbol, cancellation signal, dependencies and dispatch.
 */
async function runRequest(context: RequestContext): Promise<void> {
  const { requestId, symbol, signal, deps, dispatch } = context;
  dispatch({ type: 'requestStarted', requestId, symbol });
  try {
    const summaries = await deps.client.fetchDailySummaries(symbol, signal);
    const data = { symbol, summaries, fetchedAt: deps.clock() };
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

/**
 * Rocko Bishop
 * Maps an input rejection reason to its failure kind.
 * @param reason - Why the input was rejected.
 * @returns The matching failure kind.
 */
function toInputFailureKind(reason: 'empty' | 'malformed'): 'emptyInput' | 'malformedInput' {
  return reason === 'empty' ? 'emptyInput' : 'malformedInput';
}
