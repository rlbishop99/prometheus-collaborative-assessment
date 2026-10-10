import type { ReactNode } from 'react';

import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

/**
 * Rocko Bishop
 * Magnifying glass for the search button. It inherits the button's text color, so it follows the
 * button's own states.
 * @param props - Optional label, class and size.
 * @returns The icon.
 */
export function SearchIcon(props: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </SvgIcon>
  );
}
