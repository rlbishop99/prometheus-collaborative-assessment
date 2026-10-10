import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * The app's mark: a rising stock-chart line ending in an arrow, matching the mockups' logo sketch.
 * The final segment climbs at 45 degrees and ends exactly on the arrowhead's corner (28,6), so the
 * line reads as the arrow's shaft. It is two-tone: brand color for the line, accent for the head.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function LogoMarkIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 32 32" className={joinClassNames(styles.brand, className)} {...props}>
      <polyline
        points="3,26 9,17 14,21 28,6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        className={styles.brandAccent}
        points="20,6 28,6 28,14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
