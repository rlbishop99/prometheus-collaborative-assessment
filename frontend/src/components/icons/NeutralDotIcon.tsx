import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

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
