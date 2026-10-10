import type { ReactNode } from 'react';

import { metricLabels } from '../../content/metricLabels';
import { formatDay } from '../../domain/formatDay';
import { formatPrice, formatVolume } from '../../domain/formatNumber';
import type { DailySummary } from '../../domain/types';
import type { Comparison } from '../indicators/comparison';
import { MetricCell } from './MetricCell';

/** Props shared by the four field cells: the day to show, plus an optional comparison. */
export interface FieldCellProps {
  readonly summary: DailySummary | undefined;
  readonly comparison?: Comparison;
}

export function DayCell({ summary }: FieldCellProps): ReactNode {
  return <MetricCell label={metricLabels.day} value={summary && formatDay(summary.day)} />;
}

export function VolumeCell({ summary, comparison }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label={metricLabels.volume}
      value={summary && formatVolume(summary.volume)}
      comparison={comparison}
    />
  );
}

export function LowAverageCell({ summary, comparison }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label={metricLabels.lowAverage}
      value={summary && formatPrice(summary.lowAverage)}
      comparison={comparison}
    />
  );
}

export function HighAverageCell({ summary, comparison }: FieldCellProps): ReactNode {
  return (
    <MetricCell
      label={metricLabels.highAverage}
      value={summary && formatPrice(summary.highAverage)}
      comparison={comparison}
    />
  );
}
