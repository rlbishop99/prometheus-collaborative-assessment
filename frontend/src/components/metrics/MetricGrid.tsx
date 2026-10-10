import type { ReactNode } from 'react';

import { formatDay } from '../../domain/formatDay';
import { computeTrend } from '../../domain/trend';
import type { DailySummary } from '../../domain/types';
import { TrendIndicator } from '../indicators/TrendIndicator';
import { DayCell, HighAverageCell, LowAverageCell, VolumeCell } from './cells';
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
 * The four cells in mockup order (Day, Volume, Low Average, High Average). It decides when
 * indicators apply: only for a day other than the latest, which has no baseline to compare
 * against.
 * @param props - Selected and latest summaries, and the loading flag.
 * @returns The metric grid.
 */
export function MetricGrid({ selected, latest, busy }: MetricGridProps): ReactNode {
  const indicatorFor = (field: ComparableField): ReactNode =>
    renderIndicator(selected, latest, field);

  return (
    <section aria-label="Daily summary" aria-live="polite" aria-busy={busy}>
      <dl className={styles.grid}>
        <DayCell summary={selected} />
        <VolumeCell summary={selected} indicator={indicatorFor('volume')} />
        <LowAverageCell summary={selected} indicator={indicatorFor('lowAverage')} />
        <HighAverageCell summary={selected} indicator={indicatorFor('highAverage')} />
      </dl>
    </section>
  );
}

/**
 * Rocko Bishop
 * Builds the trend indicator for one field, or nothing when no comparison applies (no data, or
 * the latest day itself is selected).
 * @param selected - The viewed day.
 * @param latest - The baseline day.
 * @param field - Which value to compare.
 * @returns The indicator element, or null.
 */
function renderIndicator(
  selected: DailySummary | undefined,
  latest: DailySummary | undefined,
  field: ComparableField,
): ReactNode {
  if (!selected || !latest || selected.day === latest.day) {
    return null;
  }
  return (
    <TrendIndicator
      trend={computeTrend(selected[field], latest[field])}
      baselineLabel={formatDay(latest.day)}
    />
  );
}
