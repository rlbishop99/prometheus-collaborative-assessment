import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MetricGrid } from '../../../src/components/metrics/MetricGrid';
import type { DailySummary } from '../../../src/domain/types';

const latest: DailySummary = {
  day: '2026-10-09',
  lowAverage: 100,
  highAverage: 200,
  volume: 1_000_000,
};

/** The value area of a cell: the element that describes the cell's focusable group. */
const valueOf = (label: string): HTMLElement => {
  const group = screen.getByRole('group', { name: label });
  const value = document.getElementById(group.getAttribute('aria-describedby') ?? '');
  if (!value) throw new Error(`No value for ${label}`);
  return value;
};

describe('MetricGrid', () => {
  it('renders the four cells in mockup order', () => {
    render(<MetricGrid selected={undefined} latest={undefined} busy={false} />);

    expect(
      screen.getAllByRole('group').map((group) => group.querySelector('p')?.textContent),
    ).toEqual(['Day', 'Volume', 'Low Average', 'High Average']);
  });

  it('shows "---" placeholders, announced as "No data", when there is nothing to show', () => {
    render(<MetricGrid selected={undefined} latest={undefined} busy={false} />);

    for (const label of ['Day', 'Volume', 'Low Average', 'High Average']) {
      expect(valueOf(label)).toHaveTextContent('---');
      expect(within(valueOf(label)).getByText('No data')).toHaveClass('visually-hidden');
    }
    expect(screen.getByRole('group', { name: 'Day' })).toHaveAccessibleDescription('No data');
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

    // The comparison is visible text for everyone, read together with the value.
    expect(valueOf('Volume')).toHaveTextContent('2,000,000 Higher than Oct 9th');
    expect(valueOf('Low Average')).toHaveTextContent('80.0000 Lower than Oct 9th');
    expect(valueOf('High Average')).toHaveTextContent('201.0000 Within 1% of Oct 9th');
    expect(screen.getByText('Higher than Oct 9th')).toBeVisible();
    expect(valueOf('Day')).toHaveTextContent(/^Oct 1st, 2026$/);
  });

  it('shows a glyph per comparison, hidden from screen readers to avoid reading it twice', () => {
    const earlier: DailySummary = { ...latest, day: '2026-10-01', volume: 2_000_000 };
    render(<MetricGrid selected={earlier} latest={latest} busy={false} />);

    const glyph = valueOf('Volume').querySelector('svg');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveClass('trendUp');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('makes every cell a keyboard stop named by its label and described by its value', async () => {
    const user = userEvent.setup();
    const earlier: DailySummary = { ...latest, day: '2026-10-01', volume: 2_000_000 };
    render(<MetricGrid selected={earlier} latest={latest} busy={false} />);

    const names = ['Day', 'Volume', 'Low Average', 'High Average'];
    for (const name of names) {
      await user.tab();
      expect(screen.getByRole('group', { name })).toHaveFocus();
    }
    expect(screen.getByRole('group', { name: 'Volume' })).toHaveAccessibleDescription(
      '2,000,000 Higher than Oct 9th',
    );
  });

  it('announces updates politely and exposes the loading state', () => {
    render(<MetricGrid selected={undefined} latest={undefined} busy />);
    const region = screen.getByRole('region', { name: 'Daily summary' });

    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-busy', 'true');
  });
});
