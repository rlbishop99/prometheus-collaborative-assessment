import type { SearchFailure } from '../state/searchTypes';

/** Exact wording agreed for the outage banner. */
export const UNREACHABLE_MESSAGE = 'Error: Symbol API currently unreachable';

/**
 * Rocko Bishop
 * Returns the user-facing text for a failure. All copy lives here, so wording can change (or be
 * localized) without touching components.
 * @param failure - What went wrong.
 * @returns The message for the warning banner.
 */
export function warningMessageFor(failure: SearchFailure): string {
  switch (failure.kind) {
    case 'emptyInput':
      return 'No input found. Please enter a valid Stock Symbol to search.';
    case 'malformedInput':
      return 'Invalid input found. Symbols use 1-15 letters, digits, or .-^=.';
    case 'notFound':
      return `No results found for ${failure.symbol ?? 'that symbol'}. Check the Symbol's spelling and try again.`;
    case 'noData':
      return `No trading data found for ${failure.symbol ?? 'that symbol'} in the last 30 days.`;
    case 'unreachable':
      return UNREACHABLE_MESSAGE;
    case 'unknown':
      return 'Oops! Something went wrong while processing data. Please try again.';
  }
}
