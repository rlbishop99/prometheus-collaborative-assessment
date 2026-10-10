import type { ReactNode } from 'react';

import { metricGridCopy } from '../../content/metricLabels';
import type { DailySummary } from '../../domain/types';
import { buildComparison } from '../indicators/comparison';
import type { ComparableField, Comparison } from '../indicators/comparison';
import { DayCell, HighAverageCell, LowAverageCell, VolumeCell } from './cells';
import styles from './MetricGrid.module.css';

interface MetricGridProps {
  /** The day being viewed; undefined renders all placeholders. */
  readonly selected: DailySummary | undefined;
  /** The latest (in-progress) day, which is the comparison baseline. */
  readonly latest: DailySummary | undefined;
  readonly busy: boolean;
}

/**
 * Rocko Bishop
 * The four Day-view cells in a named live region. The explicit `role="list"` keeps list semantics
 * in Safari, which drops them from lists styled without bullets.
 */
export function MetricGrid({ selected, latest, busy }: MetricGridProps): ReactNode {
  const comparisonFor = (field: ComparableField): Comparison | undefined =>
    buildComparison(selected, latest, field);

  return (
    <section
      className={styles.region}
      aria-label={metricGridCopy.regionLabel}
      aria-live="polite"
      aria-busy={busy}
    >
      <ul className={styles.grid} role="list">
        <DayCell summary={selected} />
        <VolumeCell summary={selected} comparison={comparisonFor('volume')} />
        <LowAverageCell summary={selected} comparison={comparisonFor('lowAverage')} />
        <HighAverageCell summary={selected} comparison={comparisonFor('highAverage')} />
      </ul>
    </section>
  );
}
