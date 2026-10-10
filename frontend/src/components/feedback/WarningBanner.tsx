import type { ReactNode } from 'react';

import { WarningIcon } from '../icons/WarningIcon';
import styles from './WarningBanner.module.css';

interface WarningBannerProps {
  readonly message: string;
}

/**
 * Rocko Bishop
 * The single warning template used for every warning, as agreed. `role="alert"` makes screen
 * readers announce it as soon as it appears; the icon is decorative because the text carries the
 * meaning.
 * @param props - The message to show.
 * @returns The banner.
 */
export function WarningBanner({ message }: WarningBannerProps): ReactNode {
  return (
    <div className={styles.banner} role="alert">
      <WarningIcon size={22} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
