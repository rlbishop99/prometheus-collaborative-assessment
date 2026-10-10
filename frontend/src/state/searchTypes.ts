import type { DailySummaries } from '../domain/types';

/** A symbol's summaries plus when they were fetched, which drives cache freshness. */
export interface SymbolData {
  readonly symbol: string;
  readonly summaries: DailySummaries;
  /** Epoch milliseconds. */
  readonly fetchedAt: number;
}

/**
 * Why a search did not produce usable data. Server-side "invalid input" is folded into
 * `malformedInput`, so the user sees one consistent message whichever side caught it. `noData`
 * is a successful search that returned zero trading days.
 */
export type SearchFailureKind =
  'emptyInput' | 'malformedInput' | 'notFound' | 'noData' | 'unreachable' | 'unknown';

export interface SearchFailure {
  readonly kind: SearchFailureKind;
  /** The symbol searched, when one was parsed (used in messages such as "not found"). */
  readonly symbol?: string;
}

/**
 * The search state machine. `retained` carries the last good data for the *same* symbol through a
 * failure, which is how the UI keeps showing data under the "unreachable" warning.
 */
export type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly requestId: number; readonly symbol: string }
  | { readonly status: 'success'; readonly data: SymbolData }
  | {
      readonly status: 'error';
      readonly failure: SearchFailure;
      readonly retained?: SymbolData;
    };

export type SearchAction =
  | { readonly type: 'inputRejected'; readonly kind: 'emptyInput' | 'malformedInput' }
  | { readonly type: 'servedFromCache'; readonly data: SymbolData }
  | { readonly type: 'requestStarted'; readonly requestId: number; readonly symbol: string }
  | { readonly type: 'requestSucceeded'; readonly requestId: number; readonly data: SymbolData }
  | {
      readonly type: 'requestFailed';
      readonly requestId: number;
      readonly failure: SearchFailure;
      readonly retained?: SymbolData;
    };
