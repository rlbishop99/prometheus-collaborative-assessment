import type { ReactNode } from 'react';

import { formatDay } from '../../domain/formatDay';
import { formatPrice, formatVolume } from '../../domain/formatNumber';
import type { DailySummary } from '../../domain/types';
import { MetricCell } from './MetricCell';

/** A trend glyph and the sentence explaining it; always shown together. */
export interface Comparison {
  readonly indicator: ReactNode;
  readonly caption: string;
}

/** Props shared by the four field cells: the day to show, plus an optional comparison. */
export interface FieldCellProps {
  readonly summary: DailySummary | undefined;
  readonly comparison?: Comparison;
}

/**
 * Rocko Bishop
 * The "Day" cell: the selected trading day as `Jan 1st, 1999`. It never has a comparison.
 * @param props - The selected summary.
 * @returns The cell.
 */
export function DayCell({ summary }: FieldCellProps): ReactNode {
  return <MetricCell label="Day" value={summary && formatDay(summary.day)} />;
}

/**
 * Rocko Bishop
 * The "Volume" cell: total shares traded that day.
 * @param props - The selected summary and its comparison.
 * @returns The cell.
 */
export function VolumeCell({ summary, comparison }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label="Volume"
      value={summary && formatVolume(summary.volume)}
      indicator={comparison?.indicator}
      caption={comparison?.caption}
    />
  );
}

/**
 * Rocko Bishop
 * The "Low Average" cell: the mean of that day's 15-minute lows.
 * @param props - The selected summary and its comparison.
 * @returns The cell.
 */
export function LowAverageCell({ summary, comparison }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label="Low Average"
      value={summary && formatPrice(summary.lowAverage)}
      indicator={comparison?.indicator}
      caption={comparison?.caption}
    />
  );
}

/**
 * Rocko Bishop
 * The "High Average" cell: the mean of that day's 15-minute highs.
 * @param props - The selected summary and its comparison.
 * @returns The cell.
 */
export function HighAverageCell({ summary, comparison }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label="High Average"
      value={summary && formatPrice(summary.highAverage)}
      indicator={comparison?.indicator}
      caption={comparison?.caption}
    />
  );
}
