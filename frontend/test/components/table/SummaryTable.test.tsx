import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SummaryTable } from '../../../src/components/table/SummaryTable';
import { tslaSummaries } from '../../support/fixtures';

const latest = tslaSummaries.at(-1);
if (!latest) throw new Error('The fixture has no days');

const renderTable = (restoreRow?: string): { onOpenDay: ReturnType<typeof vi.fn> } => {
  const onOpenDay = vi.fn();
  render(
    <SummaryTable
      summaries={tslaSummaries}
      latest={latest}
      busy={false}
      onOpenDay={onOpenDay}
      restoreRow={restoreRow}
    />,
  );
  return { onOpenDay };
};

const bodyRows = (): HTMLElement[] =>
  within(screen.getByRole('table', { name: 'Daily summaries' }))
    .getAllByRole('row')
    .slice(1);

const rowAt = (index: number): HTMLElement => {
  const row = bodyRows()[index];
  if (!row) throw new Error(`No row ${index}`);
  return row;
};

describe('SummaryTable', () => {
  it('lists every day newest first, under fully named column headers', () => {
    renderTable();

    const headers = screen.getAllByRole('columnheader');
    ['Day', 'Volume', 'Low Average', 'High Average'].forEach((name, index) => {
      expect(headers[index]).toHaveAccessibleName(name);
    });
    expect(bodyRows().map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      'Oct 9th, 2026',
      'Oct 8th, 2026',
      'Oct 7th, 2026',
    ]);
  });

  it('compares each earlier day with the latest, and explains the arrows', () => {
    renderTable();
    const newest = rowAt(0);
    const oldest = rowAt(2);

    expect(screen.getByRole('table')).toHaveAccessibleDescription(
      'Arrows compare each day with Oct 9th, the latest day.',
    );
    expect(newest).not.toHaveTextContent(/than|Within/);
    expect(within(oldest).getAllByText('Lower than Oct 9th')).toHaveLength(3);
    expect(oldest.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(3);
  });

  it('opens a day when its row or its button is used', async () => {
    const user = userEvent.setup();
    const { onOpenDay } = renderTable();
    const [, lowAverageCell] = within(rowAt(1)).getAllByRole('cell');
    if (!lowAverageCell) throw new Error('No low-average cell');

    await user.click(lowAverageCell);
    within(rowAt(2)).getByRole('button').focus();
    await user.keyboard('{Enter}');

    expect(onOpenDay.mock.calls).toEqual([['2026-10-08'], ['2026-10-07']]);
  });

  it('describes each row button as opening the Day view', () => {
    renderTable();

    expect(screen.getByRole('button', { name: 'Oct 8th, 2026' })).toHaveAccessibleDescription(
      'Opens this day in the Day view.',
    );
  });

  it('keeps its note and headers without data, over 30 skeleton rows announced once', () => {
    const { container } = render(
      <SummaryTable summaries={[]} latest={undefined} busy onOpenDay={vi.fn()} />,
    );

    expect(screen.getByRole('table')).toHaveAccessibleDescription(
      'Arrows compare each day with the latest day.',
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(30);
    expect(bodyRows()).toHaveLength(1);
    expect(within(rowAt(0)).getAllByText('No data')).toHaveLength(4);
  });

  it('scrolls back to, and focuses, the row it was asked to restore', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    renderTable('2026-10-08');

    const button = screen.getByRole('button', { name: 'Oct 8th, 2026' });
    expect(button).toHaveFocus();
    expect(scrollIntoView.mock.contexts).toEqual([button]);
  });
});
