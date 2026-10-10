import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

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
