import type { DailySummaries } from '../domain/types';

/** A symbol's summaries, as last returned by the API. */
export interface SymbolData {
  readonly symbol: string;
  readonly summaries: DailySummaries;
}

/**
 * Why a search did not produce usable data. Server-side "invalid input" is folded into
 * `malformedInput`, so the user sees one consistent message whichever side caught it. `noData`
 * is a successful search that returned zero trading days.
 */
export type SearchFailureKind =
  'emptyInput' | 'malformedInput' | 'notFound' | 'noData' | 'unreachable' | 'unknown';

/** The failures caught locally, before any request is made. */
export type InputFailureKind = Extract<SearchFailureKind, 'emptyInput' | 'malformedInput'>;

export interface SearchFailure {
  readonly kind: SearchFailureKind;
  /** The symbol searched, when one was parsed (used in messages such as "not found"). */
  readonly symbol?: string;
}

/**
 * The search state machine. `previous` (while loading) and `retained` (after a failure) carry the
 * last good data for the *same* symbol, which is how the UI keeps showing data during a re-search
 * and under the "unreachable" warning.
 */
export type SearchState =
  | { readonly status: 'idle' }
  | {
      readonly status: 'loading';
      readonly requestId: number;
      readonly symbol: string;
      readonly previous?: SymbolData;
    }
  | { readonly status: 'success'; readonly data: SymbolData }
  | {
      readonly status: 'error';
      readonly failure: SearchFailure;
      readonly retained?: SymbolData;
    };

export type SearchAction =
  | { readonly type: 'inputRejected'; readonly kind: InputFailureKind }
  | {
      readonly type: 'requestStarted';
      readonly requestId: number;
      readonly symbol: string;
      readonly previous?: SymbolData;
    }
  | { readonly type: 'requestSucceeded'; readonly requestId: number; readonly data: SymbolData }
  | {
      readonly type: 'requestFailed';
      readonly requestId: number;
      readonly failure: SearchFailure;
      readonly retained?: SymbolData;
    };
