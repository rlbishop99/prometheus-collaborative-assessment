import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricGrid } from '../../../src/components/metrics/MetricGrid';
import type { DailySummary } from '../../../src/domain/types';

const latest: DailySummary = {
  day: '2026-10-09',
  lowAverage: 100,
  highAverage: 200,
  volume: 1_000_000,
};

/** Returns the `dd` (value) element for a labelled cell. */
const valueOf = (label: string): HTMLElement => {
  const term = screen.getByText(label, { selector: 'dt' });
  const value = term.nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error(`No value for ${label}`);
  return value;
};

describe('MetricGrid', () => {
  it('renders the four cells in mockup order', () => {
    render(<MetricGrid selected={undefined} latest={undefined} busy={false} />);

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Day',
      'Volume',
      'Low Average',
      'High Average',
    ]);
  });

  it('shows "---" placeholders, announced as "No data", when there is nothing to show', () => {
    render(<MetricGrid selected={undefined} latest={undefined} busy={false} />);

    for (const label of ['Day', 'Volume', 'Low Average', 'High Average']) {
      expect(valueOf(label)).toHaveTextContent('---');
      expect(within(valueOf(label)).getByText('No data')).toHaveClass('visually-hidden');
    }
  });

  it('formats the selected day', () => {
    render(<MetricGrid selected={latest} latest={latest} busy={false} />);

    expect(valueOf('Day')).toHaveTextContent('Oct 9th, 2026');
    expect(valueOf('Volume')).toHaveTextContent('1,000,000');
    expect(valueOf('Low Average')).toHaveTextContent('100.0000');
    expect(valueOf('High Average')).toHaveTextContent('200.0000');
  });

  it('shows no indicators for the latest (in-progress) day', () => {
    render(<MetricGrid selected={latest} latest={latest} busy={false} />);

    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('compares an earlier day with the latest day', () => {
    const earlier: DailySummary = {
      day: '2026-10-01',
      volume: 2_000_000, // higher
      lowAverage: 80, // lower
      highAverage: 201, // within 1%
    };
    render(<MetricGrid selected={earlier} latest={latest} busy={false} />);

    expect(within(valueOf('Volume')).getByRole('img')).toHaveAccessibleName(
      'Higher than Oct 9th, 2026',
    );
    expect(within(valueOf('Low Average')).getByRole('img')).toHaveAccessibleName(
      'Lower than Oct 9th, 2026',
    );
    expect(within(valueOf('High Average')).getByRole('img')).toHaveAccessibleName(
      'Within 1% of Oct 9th, 2026',
    );
    expect(within(valueOf('Day')).queryByRole('img')).not.toBeInTheDocument();
  });

  it('announces updates politely and exposes the loading state', () => {
    render(<MetricGrid selected={undefined} latest={undefined} busy />);
    const region = screen.getByRole('region', { name: 'Daily summary' });

    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-busy', 'true');
  });
});
