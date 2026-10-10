import type { ReactNode } from 'react';

import { describeTrend } from '../../content/trendLabels';
import type { Trend } from '../../domain/trend';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { NeutralDotIcon } from '../icons/NeutralDotIcon';
import styles from './TrendIndicator.module.css';

interface TrendIndicatorProps {
  readonly trend: Trend;
  /** Human-readable baseline, e.g. "Oct 9th, 2026", used in the accessible label. */
  readonly baselineLabel: string;
}

/**
 * Rocko Bishop
 * Shows how a value compares with the latest day: green up, red down, grey within 1%. Color is
 * never the only signal; the icon shape differs, and the label is announced and shown as a
 * tooltip.
 * @param props - The trend and the baseline day label.
 * @returns The indicator.
 */
export function TrendIndicator({ trend, baselineLabel }: TrendIndicatorProps): ReactNode {
  const label = describeTrend(trend, baselineLabel);
  return (
    <span className={styles.indicator} title={label}>
      {renderIcon(trend, label)}
    </span>
  );
}

/**
 * Rocko Bishop
 * Picks the icon for a trend.
 * @param trend - The trend.
 * @param label - The accessible name for the icon.
 * @returns The icon element.
 */
function renderIcon(trend: Trend, label: string): ReactNode {
  switch (trend) {
    case 'up':
      return <ArrowUpIcon label={label} size={22} />;
    case 'down':
      return <ArrowDownIcon label={label} size={22} />;
    case 'neutral':
      return <NeutralDotIcon label={label} size={18} />;
  }
}
