import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * A faint ring with a bright arc that rotates while a search runs. Under reduced motion the
 * rotation stops, and the partial ring still reads as "in progress".
 */
export function SpinnerIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" className={joinClassNames(styles.spin, className)} {...props}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        opacity="0.25"
      />
      <path
        d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
}
