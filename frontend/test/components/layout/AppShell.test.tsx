import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell, MAIN_CONTENT_ID } from '../../../src/components/layout/AppShell';

describe('AppShell', () => {
  it('exposes header, sidebar and main landmarks', () => {
    render(<AppShell title="Search">body</AppShell>);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('body');
  });

  it('renders the title as the single page heading', () => {
    render(<AppShell title="Search">body</AppShell>);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument();
  });

  it('shows the app name next to a decorative logo mark', () => {
    const { container } = render(<AppShell title="Search">body</AppShell>);

    expect(screen.getByText('Symbol Tracker')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('offers a skip link that targets the focusable main region', () => {
    render(<AppShell title="Search">body</AppShell>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      `#${MAIN_CONTENT_ID}`,
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', MAIN_CONTENT_ID);
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('renders optional header and sidebar content only when provided', () => {
    const { rerender } = render(<AppShell title="Search">body</AppShell>);
    expect(screen.queryByText('extra header')).not.toBeInTheDocument();

    rerender(
      <AppShell title="Search" headerContent="extra header" sidebarContent="side">
        body
      </AppShell>,
    );
    expect(screen.getByRole('banner')).toHaveTextContent('extra header');
    expect(screen.getByRole('complementary')).toHaveTextContent('side');
  });
});
