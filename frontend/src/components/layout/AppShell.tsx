import type { ReactNode } from 'react';

import styles from './AppShell.module.css';
import { Logo } from './Logo';

export const MAIN_CONTENT_ID = 'main-content';

interface AppShellProps {
  /** Page heading shown in the header bar (the mockups' "Search"). */
  readonly title: string;
  /** Optional extra content for the right side of the header (the mockups' "Header Content"). */
  readonly headerContent?: ReactNode;
  /** Optional sidebar content below the logo; desktop only. */
  readonly sidebarContent?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Rocko Bishop
 * Page frame from the mockups. On desktop the logo sits atop a left sidebar next to the header
 * bar; on mobile the sidebar collapses and the logo joins the header row. A single grid with named
 * areas handles both, so each element is rendered once and only CSS changes per breakpoint.
 * @param props - Title, optional header and sidebar content, and the page body.
 * @returns The page layout with header, sidebar and main landmarks.
 */
export function AppShell({
  title,
  headerContent,
  sidebarContent,
  children,
}: AppShellProps): ReactNode {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
        Skip to main content
      </a>
      <div className={styles.brand}>
        <Logo />
      </div>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {headerContent ? <div className={styles.headerContent}>{headerContent}</div> : null}
      </header>
      {/* An empty <aside> would be a pointless landmark for screen readers; keep only the column. */}
      {sidebarContent ? (
        <aside className={styles.sidebar} aria-label="Sidebar">
          {sidebarContent}
        </aside>
      ) : (
        <div className={styles.sidebar} />
      )}
      <main id={MAIN_CONTENT_ID} className={styles.main} tabIndex={-1}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
