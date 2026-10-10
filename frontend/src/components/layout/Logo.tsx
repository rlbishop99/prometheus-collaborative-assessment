import type { ReactNode } from 'react';

import { APP_NAME } from '../../content/documentTitle';
import { LogoMarkIcon } from '../icons/LogoMarkIcon';
import styles from './Logo.module.css';

export function Logo(): ReactNode {
  return (
    <div className={styles.logo}>
      <LogoMarkIcon size={32} />
      <span className={styles.wordmark}>{APP_NAME}</span>
    </div>
  );
}
