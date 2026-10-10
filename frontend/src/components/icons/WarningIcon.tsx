import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';
import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * Yellow warning triangle with an exclamation mark, used by the warning banner. Both colors come
 * from tokens, so the icon follows the theme.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function WarningIcon({ className, ...props }: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" className={joinClassNames(styles.warning, className)} {...props}>
      <path
        d="M10.3 3.9 1.8 18.5A2 2 0 0 0 3.5 21.5h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
        fill="currentColor"
      />
      <g className={styles.warningGlyph}>
        <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17.25" r="1.25" fill="currentColor" />
      </g>
    </SvgIcon>
  );
}
