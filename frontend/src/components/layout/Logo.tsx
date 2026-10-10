import type { ReactNode } from 'react';

import { APP_NAME } from '../../content/documentTitle';
import { LogoMarkIcon } from '../icons/LogoMarkIcon';
import styles from './Logo.module.css';

/**
 * Rocko Bishop
 * The brand lockup: the chart mark beside the app name. The mark is decorative, because the
 * visible text already names the app.
 * @returns The logo.
 */
export function Logo(): ReactNode {
  return (
    <div className={styles.logo}>
      <LogoMarkIcon size={32} />
      <span className={styles.wordmark}>{APP_NAME}</span>
    </div>
  );
}
