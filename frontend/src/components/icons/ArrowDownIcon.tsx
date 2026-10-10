import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * Red downward triangle: the value is lower than the latest day's.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function ArrowDownIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" className={joinClassNames(styles.trendDown, className)} {...props}>
      <path
        d="M12 20 3 5h18z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
