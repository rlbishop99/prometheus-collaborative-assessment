import type { ReactNode } from 'react';

import { SvgIcon } from './SvgIcon';
import type { IconProps } from './SvgIcon';

export function BackArrowIcon(props: IconProps): ReactNode {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <path
        d="M19 12H5m6-6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
