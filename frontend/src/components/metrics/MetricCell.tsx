import { useId } from 'react';
import type { ReactNode } from 'react';

import { EmptyValue } from '../feedback/EmptyValue';
import type { Comparison } from '../indicators/comparison';
import { TrendIndicator } from '../indicators/TrendIndicator';
import styles from './MetricCell.module.css';

interface MetricCellProps {
  readonly label: string;
  /** Formatted value; undefined renders the "---" placeholder. */
  readonly value: string | undefined;
  /** Optional comparison: a decorative glyph after the value and a visible caption under it. */
  readonly comparison?: Comparison;
}

/**
 * Rocko Bishop
 * One "table cell" card: a label over a value, with an optional trend glyph and caption. Each
 * cell is a keyboard-focusable group named by its label and described by its value, so focusing
 * it (which also enlarges it) announces e.g. "Volume, group, 3,468,371, Higher than Oct 9th". The
 * placeholder is read as "No data" instead of "dash dash dash".
 */
export function MetricCell({ label, value, comparison }: MetricCellProps): ReactNode {
  const labelId = useId();
  const valueId = useId();

  return (
    <li className={styles.slot}>
      <div
        className={styles.cell}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={valueId}
        tabIndex={0}
      >
        <p id={labelId} className={styles.label}>
          {label}
        </p>
        <div id={valueId} className={styles.body}>
          {value === undefined ? (
            <span className={styles.valueRow}>
              <EmptyValue className={styles.placeholder} />
            </span>
          ) : (
            <>
              <span className={styles.valueRow}>
                <span className={styles.value}>{value}</span>
                {comparison ? <TrendIndicator trend={comparison.trend} /> : null}
              </span>
              {/* The space keeps value and caption separate words for screen readers. */}
              {comparison ? (
                <>
                  {' '}
                  <span className={styles.caption}>{comparison.caption}</span>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
