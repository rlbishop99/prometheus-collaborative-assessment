import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

export function ArrowUpIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" className={joinClassNames(styles.trendUp, className)} {...props}>
      <path
        d="M12 4 21 19H3z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
