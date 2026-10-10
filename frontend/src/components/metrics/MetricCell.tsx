import type { ReactNode } from 'react';

import styles from './MetricCell.module.css';

export const PLACEHOLDER = '---';

interface MetricCellProps {
  readonly label: string;
  /** Formatted value; undefined renders the "---" placeholder. */
  readonly value: string | undefined;
  /** Optional decorative trend glyph shown after the value. */
  readonly indicator?: ReactNode;
  /** Optional visible caption under the value, e.g. "Higher than Oct 9th". */
  readonly caption?: string;
}

/**
 * Rocko Bishop
 * One "table cell" card: a label over a value, with an optional indicator and caption. It is a
 * `dt`/`dd` pair inside the grid's description list, so screen readers announce the label, the
 * value and the caption together. The placeholder is read as "No data" instead of
 * "dash dash dash".
 * @param props - Label, value, and the optional indicator and caption.
 * @returns The cell.
 */
export function MetricCell({ label, value, indicator, caption }: MetricCellProps): ReactNode {
  return (
    <div className={styles.cell}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.body}>
        {value === undefined ? (
          <span className={styles.valueRow}>
            <span className={styles.placeholder} aria-hidden="true">
              {PLACEHOLDER}
            </span>
            <span className="visually-hidden">No data</span>
          </span>
        ) : (
          <>
            <span className={styles.valueRow}>
              <span className={styles.value}>{value}</span>
              {indicator}
            </span>
            {caption ? <span className={styles.caption}>{caption}</span> : null}
          </>
        )}
      </dd>
    </div>
  );
}
