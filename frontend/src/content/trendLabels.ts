import type { Trend } from '../domain/trend';

/**
 * Rocko Bishop
 * Builds the sentence that describes a trend indicator, used as its accessible name and tooltip.
 * It lives with the other user-facing copy so wording changes stay out of components.
 * @param trend - The trend.
 * @param baselineLabel - The baseline day, e.g. "Oct 9th, 2026".
 * @returns e.g. "Higher than Oct 9th, 2026".
 */
export function describeTrend(trend: Trend, baselineLabel: string): string {
  switch (trend) {
    case 'up':
      return `Higher than ${baselineLabel}`;
    case 'down':
      return `Lower than ${baselineLabel}`;
    case 'neutral':
      return `Within 1% of ${baselineLabel}`;
  }
}
