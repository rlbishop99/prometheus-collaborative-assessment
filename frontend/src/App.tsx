import type { ReactNode } from 'react';

import { AppShell } from './components/layout/AppShell';

/**
 * Rocko Bishop
 * Root component. It currently renders the page frame; the search form, the date picker and the
 * metric cells are added in later build steps.
 * @returns The application UI.
 */
export function App(): ReactNode {
  return <AppShell title="Search">{null}</AppShell>;
}
