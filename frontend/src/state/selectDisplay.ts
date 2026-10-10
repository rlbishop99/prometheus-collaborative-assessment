import type { SearchFailure, SearchState, SymbolData } from './searchTypes';

/** What the screen should show, derived purely from the search state. */
export interface DisplayModel {
  /** Data to render in the cells; absent means "---" placeholders. */
  readonly data?: SymbolData;
  /** A warning to show in the banner, if any. */
  readonly warning?: SearchFailure;
  readonly loading: boolean;
}

/**
 * Rocko Bishop
 * Maps the search state to what is displayed. Keeping this out of components means the rules
 * (retained data under failures, the empty-result warning) are tested once and rendered
 * consistently.
 * @param state - The current search state.
 * @returns The display model.
 */
export function selectDisplay(state: SearchState): DisplayModel {
  switch (state.status) {
    case 'idle':
      return { loading: false };
    case 'loading':
      return { loading: true };
    case 'success':
      return state.data.summaries.length === 0
        ? {
            data: state.data,
            warning: { kind: 'noData', symbol: state.data.symbol },
            loading: false,
          }
        : { data: state.data, loading: false };
    case 'error':
      return { data: state.retained, warning: state.failure, loading: false };
  }
}
