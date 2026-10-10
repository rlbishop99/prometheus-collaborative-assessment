import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { viewCopy } from '../../content/viewCopy';
import { BackArrowIcon } from '../icons/BackArrowIcon';
import styles from './ViewControls.module.css';

interface BackToTableButtonProps {
  readonly onBack: () => void;
}

/**
 * Rocko Bishop
 * Returns from a day opened via a table row. It takes focus when it appears: the row button the
 * user activated has just unmounted with the table, so focus would otherwise fall to the page, and
 * this is the control a keyboard user most likely wants next.
 */
export function BackToTableButton({ onBack }: BackToTableButtonProps): ReactNode {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <button ref={buttonRef} type="button" className={styles.back} onClick={onBack}>
      <BackArrowIcon size={20} />
      <span>{viewCopy.backToTable}</span>
    </button>
  );
}
