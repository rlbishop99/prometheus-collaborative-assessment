import type { ReactNode } from 'react';

import { layoutCopy } from '../../content/layoutCopy';
import styles from './AppShell.module.css';
import { Logo } from './Logo';

export const MAIN_CONTENT_ID = 'main-content';

interface AppShellProps {
  /** Page heading shown in the header bar (the mockups' "Search"). */
  readonly title: string;
  readonly children: ReactNode;
}

/**
 * Rocko Bishop
 * Page frame from the mockups. On desktop the logo sits atop a left sidebar next to the header
 * bar; on mobile the sidebar collapses and the logo joins the header row. A single grid with named
 * areas handles both, so each element is rendered once and only CSS changes per breakpoint.
 */
export function AppShell({ title, children }: AppShellProps): ReactNode {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
        {layoutCopy.skipLink}
      </a>
      <div className={styles.brand}>
        <Logo />
      </div>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>
      {/* The mockups' empty sidebar column; a plain div, since an empty <aside> is a useless landmark. */}
      <div className={styles.sidebar} />
      <main id={MAIN_CONTENT_ID} className={styles.main} tabIndex={-1}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
