import type { ReactNode } from 'react';

import styles from './MetricCell.module.css';

export const PLACEHOLDER = '---';

interface MetricCellProps {
  readonly label: string;
  /** Formatted value; undefined renders the "---" placeholder. */
  readonly value: string | undefined;
  /** Optional trend indicator shown after the value. */
  readonly indicator?: ReactNode;
}

/**
 * Rocko Bishop
 * One "table cell" card: a label over a value, with an optional indicator. It is a `dt`/`dd`
 * pair inside the grid's description list, so screen readers announce each value with its label.
 * The placeholder is read as "No data" instead of "dash dash dash".
 * @param props - Label, value and optional indicator.
 * @returns The cell.
 */
export function MetricCell({ label, value, indicator }: MetricCellProps): ReactNode {
  return (
    <div className={styles.cell}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.valueRow}>
        {value === undefined ? (
          <>
            <span className={styles.placeholder} aria-hidden="true">
              {PLACEHOLDER}
            </span>
            <span className="visually-hidden">No data</span>
          </>
        ) : (
          <>
            <span className={styles.value}>{value}</span>
            {indicator}
          </>
        )}
      </dd>
    </div>
  );
}
