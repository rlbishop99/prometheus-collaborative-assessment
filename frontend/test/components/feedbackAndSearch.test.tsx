import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WarningBanner } from '../../src/components/feedback/WarningBanner';
import { SymbolSearchForm } from '../../src/components/search/SymbolSearchForm';
import { describeTrend } from '../../src/content/trendLabels';

describe('WarningBanner', () => {
  it('announces the message as an alert with a decorative icon', () => {
    const { container } = render(
      <WarningBanner message="Error: Symbol API currently unreachable" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Error: Symbol API currently unreachable');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SymbolSearchForm', () => {
  it('is a labelled search landmark', () => {
    render(<SymbolSearchForm onSearch={vi.fn()} busy={false} />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Stock symbol' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('submits the raw text with the button or the Enter key', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SymbolSearchForm onSearch={onSearch} busy={false} />);

    await user.type(screen.getByRole('textbox'), ' tsla ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.type(screen.getByRole('textbox'), '{Enter}');

    expect(onSearch).toHaveBeenNthCalledWith(1, ' tsla ');
    expect(onSearch).toHaveBeenNthCalledWith(2, ' tsla ');
  });

  it('submits empty input so the caller can explain what is wrong', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SymbolSearchForm onSearch={onSearch} busy={false} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('marks itself busy while a search runs', () => {
    render(<SymbolSearchForm onSearch={vi.fn()} busy />);

    expect(screen.getByRole('search')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('describeTrend', () => {
  it.each([
    ['up', 'Higher than Oct 9th, 2026'],
    ['down', 'Lower than Oct 9th, 2026'],
    ['neutral', 'Within 1% of Oct 9th, 2026'],
  ] as const)('%s -> %s', (trend, label) => {
    expect(describeTrend(trend, 'Oct 9th, 2026')).toBe(label);
  });
});
