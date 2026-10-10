import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * Up arrow inside a circle, matching the mobile mockups' "back to top" control. A brand-filled
 * disc with a contrasting arrow keeps it legible over any content behind it.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function ScrollTopIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" className={joinClassNames(styles.brand, className)} {...props}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path
        className={styles.onBrand}
        d="M12 17.5V7M7 11.5 12 6.5l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
