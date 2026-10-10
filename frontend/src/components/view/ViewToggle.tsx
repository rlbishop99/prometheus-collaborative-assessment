import type { ReactNode } from 'react';

import { viewCopy } from '../../content/viewCopy';
import type { ViewMode } from '../../hooks/useViewMode';
import styles from './ViewControls.module.css';

interface ViewToggleProps {
  readonly mode: ViewMode;
  readonly onChange: (mode: ViewMode) => void;
}

const OPTIONS: readonly { readonly mode: ViewMode; readonly label: string }[] = [
  { mode: 'day', label: viewCopy.day },
  { mode: 'table', label: viewCopy.table },
];

/**
 * Rocko Bishop
 * The two-option Day/Table switch. Each option is a toggle button (`aria-pressed`) inside a named
 * group, so screen readers announce "View, group, Day, toggle button, pressed" and both options
 * stay reachable with Tab.
 */
export function ViewToggle({ mode, onChange }: ViewToggleProps): ReactNode {
  return (
    <div className={styles.toggle} role="group" aria-label={viewCopy.toggleLabel}>
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          className={styles.option}
          aria-pressed={mode === option.mode}
          onClick={() => {
            onChange(option.mode);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
