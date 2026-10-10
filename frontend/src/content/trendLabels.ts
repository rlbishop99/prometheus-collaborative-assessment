import type { Trend } from '../domain/trend';

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
