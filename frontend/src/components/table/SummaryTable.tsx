import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

import { metricLabels, shortMetricLabels } from '../../content/metricLabels';
import { comparisonNoteFor, viewCopy } from '../../content/viewCopy';
import { formatDay, formatMonthDay } from '../../domain/formatDay';
import { formatPrice, formatVolume } from '../../domain/formatNumber';
import { METRIC_FIELDS } from '../../domain/metricFields';
import type { DailySummaries, DailySummary, DayKey } from '../../domain/types';
import { EmptyValue } from '../feedback/EmptyValue';
import { buildComparison } from '../indicators/comparison';
import type { Comparison } from '../indicators/comparison';
import { TrendIndicator } from '../indicators/TrendIndicator';
import styles from './SummaryTable.module.css';

/** About one row per day of the 30-day window, so the skeleton fills the panel like real data. */
const SKELETON_ROWS = 30;

interface SummaryTableProps {
  /** Every day in the window, ascending (as the API returns them). */
  readonly summaries: DailySummaries;
  /** The latest day: the comparison baseline. Undefined while there is no data to show. */
  readonly latest: DailySummary | undefined;
  readonly busy: boolean;
  readonly onOpenDay: (day: DayKey) => void;
  /** A row to scroll into view and focus when the table appears (after "Back to table"). */
  readonly restoreRow?: DayKey;
}

/**
 * Rocko Bishop
 * All days of the window, newest first. Each row's date is a real button for keyboard users; its
 * click bubbles to the row, so one handler serves both. Without data it shows skeleton rows.
 */
export function SummaryTable({
  summaries,
  latest,
  busy,
  onOpenDay,
  restoreRow,
}: SummaryTableProps): ReactNode {
  const noteId = useId();
  const hintId = useId();
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    if (restoreRow === undefined) {
      return;
    }
    const button = tableRef.current?.querySelector<HTMLButtonElement>(`[data-day="${restoreRow}"]`);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: 'center' });
  }, [restoreRow]);

  return (
    <div className={styles.panel} aria-busy={busy}>
      <p id={noteId} className={styles.note}>
        {comparisonNoteFor(latest && formatMonthDay(latest.day))}
      </p>
      <p id={hintId} hidden>
        {viewCopy.openDayHint}
      </p>
      <div className={styles.scroller}>
        <table
          ref={tableRef}
          className={styles.table}
          aria-label={viewCopy.tableLabel}
          aria-describedby={noteId}
        >
          <thead>
            <tr>
              {METRIC_FIELDS.map((field) => (
                <th key={field} scope="col">
                  <span className={styles.fullLabel}>{metricLabels[field]}</span>
                  <span className={styles.shortLabel} aria-hidden="true">
                    {shortMetricLabels[field]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={latest === undefined && busy ? styles.shimmer : undefined}>
            {latest === undefined ? <SkeletonRows /> : null}
            {summaries.toReversed().map((summary) => (
              <tr
                key={summary.day}
                className={styles.row}
                onClick={() => {
                  onOpenDay(summary.day);
                }}
              >
                <th scope="row">
                  <button
                    type="button"
                    className={styles.dayButton}
                    data-day={summary.day}
                    aria-describedby={hintId}
                  >
                    {formatDay(summary.day)}
                  </button>
                </th>
                <ValueCell
                  value={formatVolume(summary.volume)}
                  comparison={buildComparison(summary, latest, 'volume')}
                />
                <ValueCell
                  value={formatPrice(summary.lowAverage)}
                  comparison={buildComparison(summary, latest, 'lowAverage')}
                />
                <ValueCell
                  value={formatPrice(summary.highAverage)}
                  comparison={buildComparison(summary, latest, 'highAverage')}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Rocko Bishop
 * The rows shown in place of data. Only the first is announced ("No data" per column); the rest
 * are hidden from screen readers, which would otherwise read "No data" 120 times.
 */
function SkeletonRows(): ReactNode {
  return Array.from({ length: SKELETON_ROWS }, (_, row) => (
    <tr key={row} aria-hidden={row === 0 ? undefined : true}>
      {METRIC_FIELDS.map((field) => (
        <td key={field}>
          <EmptyValue className={styles.placeholder} />
        </td>
      ))}
    </tr>
  ));
}

interface ValueCellProps {
  readonly value: string;
  readonly comparison: Comparison | undefined;
}

/**
 * Rocko Bishop
 * One numeric cell. The glyph is decorative, as in the Day view, but a table has no room for a
 * visible caption per value, so the caption is kept for screen readers only; the visible note
 * above the table explains the arrows to everyone else.
 */
function ValueCell({ value, comparison }: ValueCellProps): ReactNode {
  return (
    <td>
      <span className={styles.value}>
        {value}
        {comparison ? (
          <>
            <TrendIndicator trend={comparison.trend} />
            <span className="visually-hidden"> {comparison.caption}</span>
          </>
        ) : null}
      </span>
    </td>
  );
}
