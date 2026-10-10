import type { ReactNode } from 'react';

import { describeTrend } from '../../content/trendLabels';
import { formatMonthDay } from '../../domain/formatDay';
import { computeTrend } from '../../domain/trend';
import type { DailySummary } from '../../domain/types';
import { TrendIndicator } from '../indicators/TrendIndicator';
import { DayCell, HighAverageCell, LowAverageCell, VolumeCell } from './cells';
import type { Comparison } from './cells';
import styles from './MetricGrid.module.css';

type ComparableField = 'volume' | 'lowAverage' | 'highAverage';

interface MetricGridProps {
  /** The day being viewed; undefined renders all placeholders. */
  readonly selected: DailySummary | undefined;
  /** The latest (in-progress) day, which is the comparison baseline. */
  readonly latest: DailySummary | undefined;
  readonly busy: boolean;
}

/**
 * Rocko Bishop
 * The four cells in mockup order (Day, Volume, Low Average, High Average). It decides when a
 * comparison applies: only for a day other than the latest, which has no baseline to compare
 * against. The region is a named live landmark, so screen-reader users can jump to it and hear
 * updates.
 * @param props - Selected and latest summaries, and the loading flag.
 * @returns The metric grid.
 */
export function MetricGrid({ selected, latest, busy }: MetricGridProps): ReactNode {
  const comparisonFor = (field: ComparableField): Comparison | undefined =>
    buildComparison(selected, latest, field);

  return (
    <section aria-label="Daily summary" aria-live="polite" aria-busy={busy}>
      <dl className={styles.grid}>
        <DayCell summary={selected} />
        <VolumeCell summary={selected} comparison={comparisonFor('volume')} />
        <LowAverageCell summary={selected} comparison={comparisonFor('lowAverage')} />
        <HighAverageCell summary={selected} comparison={comparisonFor('highAverage')} />
      </dl>
    </section>
  );
}

/**
 * Rocko Bishop
 * Builds the glyph and caption for one field, or nothing when no comparison applies (no data, or
 * the latest day itself is selected).
 * @param selected - The viewed day.
 * @param latest - The baseline day.
 * @param field - Which value to compare.
 * @returns The comparison, or undefined.
 */
function buildComparison(
  selected: DailySummary | undefined,
  latest: DailySummary | undefined,
  field: ComparableField,
): Comparison | undefined {
  if (!selected || !latest || selected.day === latest.day) {
    return undefined;
  }
  const trend = computeTrend(selected[field], latest[field]);
  return {
    indicator: <TrendIndicator trend={trend} />,
    caption: describeTrend(trend, formatMonthDay(latest.day)),
  };
}
