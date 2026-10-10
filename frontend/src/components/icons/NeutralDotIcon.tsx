import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * Grey circle: the value is within 1% of the latest day's.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function NeutralDotIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon
      viewBox="0 0 24 24"
      className={joinClassNames(styles.trendNeutral, className)}
      {...props}
    >
      <circle cx="12" cy="12" r="8" fill="currentColor" />
    </SvgIcon>
  );
}
