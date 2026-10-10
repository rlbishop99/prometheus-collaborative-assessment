import type { ReactNode } from 'react';

import { WarningIcon } from '../icons/WarningIcon';
import styles from './WarningBanner.module.css';

interface WarningBannerProps {
  readonly message: string;
  /** Optional id so a related control (e.g. the search input) can reference this message. */
  readonly id?: string;
}

/**
 * Rocko Bishop
 * The single warning template used for every warning, as agreed. `role="alert"` makes screen
 * readers announce it as soon as it appears; the icon is decorative because the text carries the
 * meaning.
 */
export function WarningBanner({ message, id }: WarningBannerProps): ReactNode {
  return (
    <div id={id} className={styles.banner} role="alert">
      <WarningIcon size={22} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
