import type { ReactNode } from 'react';

import { formatDay } from '../../domain/formatDay';
import { formatPrice, formatVolume } from '../../domain/formatNumber';
import type { DailySummary } from '../../domain/types';
import { MetricCell } from './MetricCell';

/** Props shared by the four field cells: the day to show, plus an optional indicator. */
export interface FieldCellProps {
  readonly summary: DailySummary | undefined;
  readonly indicator?: ReactNode;
}

/**
 * Rocko Bishop
 * The "Day" cell: the selected trading day as `Jan 1st, 1999`. It never has an indicator.
 * @param props - The selected summary.
 * @returns The cell.
 */
export function DayCell({ summary }: FieldCellProps): ReactNode {
  return <MetricCell label="Day" value={summary && formatDay(summary.day)} />;
}

/**
 * Rocko Bishop
 * The "Volume" cell: total shares traded that day.
 * @param props - The selected summary and its indicator.
 * @returns The cell.
 */
export function VolumeCell({ summary, indicator }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label="Volume"
      value={summary && formatVolume(summary.volume)}
      indicator={indicator}
    />
  );
}

/**
 * Rocko Bishop
 * The "Low Average" cell: the mean of that day's 15-minute lows.
 * @param props - The selected summary and its indicator.
 * @returns The cell.
 */
export function LowAverageCell({ summary, indicator }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label="Low Average"
      value={summary && formatPrice(summary.lowAverage)}
      indicator={indicator}
    />
  );
}

/**
 * Rocko Bishop
 * The "High Average" cell: the mean of that day's 15-minute highs.
 * @param props - The selected summary and its indicator.
 * @returns The cell.
 */
export function HighAverageCell({ summary, indicator }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label="High Average"
      value={summary && formatPrice(summary.highAverage)}
      indicator={indicator}
    />
  );
}
