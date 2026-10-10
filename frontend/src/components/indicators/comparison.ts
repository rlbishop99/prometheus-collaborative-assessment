import { describeTrend } from '../../content/trendLabels';
import { formatMonthDay } from '../../domain/formatDay';
import { computeTrend } from '../../domain/trend';
import type { Trend } from '../../domain/trend';
import type { DailySummary } from '../../domain/types';

export type ComparableField = 'volume' | 'lowAverage' | 'highAverage';

/** How one value compares with the latest day: the trend for the glyph, and the sentence for it. */
export interface Comparison {
  readonly trend: Trend;
  readonly caption: string;
}

/**
 * Rocko Bishop
 * Compares one field of a day with the latest day. Shared by the Day view and the table, so both
 * apply the same rule: the latest day is the baseline and gets no comparison of its own. Returns
 * undefined when there is no data or `selected` is the latest day.
 */
export function buildComparison(
  selected: DailySummary | undefined,
  latest: DailySummary | undefined,
  field: ComparableField,
): Comparison | undefined {
  if (!selected || !latest || selected.day === latest.day) {
    return undefined;
  }
  const trend = computeTrend(selected[field], latest[field]);
  return { trend, caption: describeTrend(trend, formatMonthDay(latest.day)) };
}
