import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * The app's mark: a rising stock-chart line ending in an arrow, matching the mockups' logo sketch.
 * It is two-tone: the brand color for the line and the accent color for the arrowhead.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function LogoMarkIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 32 32" className={joinClassNames(styles.brand, className)} {...props}>
      <polyline
        points="3,25 10,15 15,20 22,9 27,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        className={styles.brandAccent}
        points="21,5 28,5 28,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
