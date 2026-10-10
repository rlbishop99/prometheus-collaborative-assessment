import type { ReactNode } from 'react';

import { emptyValueCopy } from '../../content/metricLabels';

interface EmptyValueProps {
  /** Styles the visible "---" only. */
  readonly className?: string;
}

/**
 * Rocko Bishop
 * The "---" shown where a value is missing, in the Day cells and the table alike. Screen readers
 * hear "No data" instead of "dash dash dash".
 */
export function EmptyValue({ className }: EmptyValueProps): ReactNode {
  return (
    <>
      <span className={className} aria-hidden="true">
        {emptyValueCopy.placeholder}
      </span>
      <span className="visually-hidden">{emptyValueCopy.spoken}</span>
    </>
  );
}
