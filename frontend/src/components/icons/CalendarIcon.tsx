import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

export function CalendarIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" className={joinClassNames(styles.brand, className)} {...props}>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="14" y="13.5" width="4" height="4" rx="1" fill="currentColor" />
    </SvgIcon>
  );
}
