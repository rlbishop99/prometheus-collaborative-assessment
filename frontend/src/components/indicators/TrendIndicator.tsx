import type { ReactNode } from 'react';

import type { Trend } from '../../domain/trend';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { NeutralDotIcon } from '../icons/NeutralDotIcon';
import styles from './TrendIndicator.module.css';

interface TrendIndicatorProps {
  readonly trend: Trend;
}

/**
 * Rocko Bishop
 * The trend glyph shown next to a value: green up, red down, grey within 1%. It is decorative,
 * because the cell's visible caption states the comparison in words for every user (mouse,
 * keyboard, touch and screen reader); labelling the icon too would make screen readers say it
 * twice.
 * @param props - The trend.
 * @returns The indicator.
 */
export function TrendIndicator({ trend }: TrendIndicatorProps): ReactNode {
  return <span className={styles.indicator}>{renderIcon(trend)}</span>;
}

/**
 * Rocko Bishop
 * Picks the icon for a trend.
 * @param trend - The trend.
 * @returns The icon element.
 */
function renderIcon(trend: Trend): ReactNode {
  switch (trend) {
    case 'up':
      return <ArrowUpIcon size={22} />;
    case 'down':
      return <ArrowDownIcon size={22} />;
    case 'neutral':
      return <NeutralDotIcon size={18} />;
  }
}
