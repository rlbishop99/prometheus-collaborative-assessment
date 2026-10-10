import { useId } from 'react';
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
 * One "table cell" card: a label over a value, with an optional indicator and caption. Each cell
 * is a keyboard-focusable group named by its label and described by its value, so focusing it
 * (which also enlarges it) announces e.g. "Volume, group, 3,468,371, Higher than Oct 9th". The
 * placeholder is read as "No data" instead of "dash dash dash".
 * @param props - Label, value, and the optional indicator and caption.
 * @returns The cell, as a list item of the metric grid.
 */
export function MetricCell({ label, value, indicator, caption }: MetricCellProps): ReactNode {
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
              {/* The space keeps value and caption separate words for screen readers. */}
              {caption ? (
                <>
                  {' '}
                  <span className={styles.caption}>{caption}</span>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
