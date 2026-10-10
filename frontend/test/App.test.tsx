/*
 * End-to-end UI flows mirroring the mockups. The real hook, cache, state machine and components
 * run; only the API client is faked.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../src/api/apiError';
import { App } from '../src/App';
import { SessionCache } from '../src/state/sessionCache';
import type { DailySummaries } from '../src/domain/types';
import { clientMock, nvdaSummaries, tslaSummaries } from './support/fixtures';

const renderApp = (): {
  user: ReturnType<typeof userEvent.setup>;
  client: ReturnType<typeof clientMock>;
} => {
  const user = userEvent.setup();
  const client = clientMock();
  const cache = new SessionCache({ maxEntries: 10 });
  render(<App dependencies={{ client, cache }} />);
  return { user, client };
};

const searchFor = async (user: ReturnType<typeof userEvent.setup>, text: string): Promise<void> => {
  const input = screen.getByRole('textbox', { name: 'Stock symbol' });
  await user.clear(input);
  if (text) await user.type(input, text);
  await user.click(screen.getByRole('button', { name: 'Search' }));
};

/** The value area of a cell: the element that describes the cell's focusable group. */
const valueOf = (label: string): HTMLElement => {
  const group = screen.getByRole('group', { name: label });
  const value = document.getElementById(group.getAttribute('aria-describedby') ?? '');
  if (!value) throw new Error(`No value for ${label}`);
  return value;
};

const expectPlaceholders = (): void => {
  for (const label of ['Day', 'Volume', 'Low Average', 'High Average']) {
    expect(valueOf(label)).toHaveTextContent('---');
  }
};

describe('App', () => {
  it('before search: placeholders, no picker, no warning', () => {
    renderApp();

    expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument();
    expectPlaceholders();
    expect(screen.queryByRole('button', { name: /Trading day/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('after search: latest day without indicators, and the picker appears', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);

    await searchFor(user, 'tsla');

    expect(await screen.findByRole('button', { name: /Trading day: Oct 9th, 2026/ })).toBeVisible();
    expect(valueOf('Day')).toHaveTextContent('Oct 9th, 2026');
    expect(valueOf('Volume')).toHaveTextContent('36,336,060');
    expect(valueOf('Low Average')).toHaveTextContent('383.0629');
    expect(valueOf('High Average')).toHaveTextContent('384.8882');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('choosing an earlier day shows indicators against the latest day', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');

    await user.click(await screen.findByRole('button', { name: /Trading day/ }));
    await user.click(screen.getByRole('button', { name: /October 7th, 2026/ }));

    expect(valueOf('Day')).toHaveTextContent('Oct 7th, 2026');
    expect(within(valueOf('Volume')).getByText('Lower than Oct 9th')).toBeVisible();
    expect(within(valueOf('Low Average')).getByText('Lower than Oct 9th')).toBeVisible();
    expect(within(valueOf('Day')).queryByText(/than|Within/)).not.toBeInTheDocument();
  });

  it('a new search resets the picker to the latest day', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');
    await user.click(await screen.findByRole('button', { name: /Trading day/ }));
    await user.click(screen.getByRole('button', { name: /October 7th, 2026/ }));

    await searchFor(user, 'TSLA');

    expect(await screen.findByRole('button', { name: /Trading day: Oct 9th, 2026/ })).toBeVisible();
  });

  it('table view: hides the picker and lists every day, newest first', async () => {
    const { user, client } = renderApp();
    expect(screen.queryByRole('group', { name: 'View' })).not.toBeInTheDocument();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');

    await user.click(await screen.findByRole('button', { name: 'Table' }));

    expect(screen.queryByRole('button', { name: /Trading day/ })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'Daily summaries' }))
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Oct 9th, 2026', 'Oct 8th, 2026', 'Oct 7th, 2026']);
  });

  it('table view: stays in place while a new symbol loads, then shows its data', async () => {
    const { user, client } = renderApp();
    let resolveNvda!: (value: DailySummaries) => void;
    client.fetchDailySummaries.mockResolvedValueOnce(tslaSummaries).mockReturnValueOnce(
      new Promise<DailySummaries>((resolve) => {
        resolveNvda = resolve;
      }),
    );
    await searchFor(user, 'TSLA');
    await user.click(await screen.findByRole('button', { name: 'Table' }));

    await searchFor(user, 'NVDA');

    expect(screen.getByRole('table', { name: 'Daily summaries' })).toHaveAccessibleDescription(
      'Arrows compare each day with the latest day.',
    );
    expect(screen.queryByRole('group', { name: 'Day' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true');

    await act(async () => {
      resolveNvda(nvdaSummaries);
      await Promise.resolve();
    });
    expect(
      within(screen.getByRole('table', { name: 'Daily summaries' }))
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Oct 9th, 2026']);
  });

  it('day view: keeps the picker (as "---") and the toggle when data is lost', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries
      .mockResolvedValueOnce(tslaSummaries)
      .mockRejectedValueOnce(new ApiError('notFound', 'nope'));
    await searchFor(user, 'TSLA');
    await screen.findByRole('button', { name: /Trading day: Oct 9th, 2026/ });

    await searchFor(user, 'ZZZZ');

    await screen.findByRole('alert');
    expectPlaceholders();
    const trigger = screen.getByRole('button', { name: 'Trading day: No data' });
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('opening a row shows that day, and "Back to table" returns to the same row', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');
    await user.click(await screen.findByRole('button', { name: 'Table' }));

    await user.click(screen.getByRole('button', { name: 'Oct 7th, 2026' }));

    expect(valueOf('Day')).toHaveTextContent('Oct 7th, 2026');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
    const back = screen.getByRole('button', { name: 'Back to table' });
    expect(back).toHaveFocus();

    await user.click(back);

    expect(screen.getByRole('button', { name: 'Oct 7th, 2026' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Back to table' })).not.toBeInTheDocument();
  });

  it('offers "Back to table" only after opening a row', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');
    await user.click(await screen.findByRole('button', { name: 'Table' }));
    await user.click(screen.getByRole('button', { name: 'Oct 7th, 2026' }));

    await user.click(screen.getByRole('button', { name: 'Table' }));
    await user.click(screen.getByRole('button', { name: 'Day' }));

    expect(screen.queryByRole('button', { name: 'Back to table' })).not.toBeInTheDocument();
  });

  it('same-session outage: keeps the data while retrying and under the warning', async () => {
    const { user, client } = renderApp();
    let failRequest!: (error: ApiError) => void;
    client.fetchDailySummaries.mockResolvedValueOnce(tslaSummaries).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        failRequest = reject;
      }),
    );
    await searchFor(user, 'TSLA');
    await screen.findByRole('button', { name: /Trading day/ });

    await searchFor(user, 'TSLA');

    expect(screen.getByRole('region', { name: 'Daily summary' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(valueOf('Day')).toHaveTextContent('Oct 9th, 2026');
    expect(screen.getByRole('button', { name: /Trading day/ })).toBeVisible();

    failRequest(new ApiError('unreachable', 'down'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Error: Symbol API currently unreachable',
    );
    expect(valueOf('Day')).toHaveTextContent('Oct 9th, 2026');
    expect(screen.getByRole('button', { name: /Trading day/ })).toBeVisible();
  });

  it('new-session outage: placeholders with the unreachable warning', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockRejectedValueOnce(new ApiError('unreachable', 'down'));

    await searchFor(user, 'NVDA');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Error: Symbol API currently unreachable',
    );
    expectPlaceholders();
    expect(screen.queryByRole('button', { name: /Trading day/ })).not.toBeInTheDocument();
  });

  it.each([
    ['', 'No input found. Please enter a valid Stock Symbol to search.'],
    ['bad symbol!', 'Invalid input found. Symbols use 1-15 letters, digits, or .-^=.'],
  ])('rejects %j locally with its warning', async (input, message) => {
    const { user, client } = renderApp();

    await searchFor(user, input);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expectPlaceholders();
    expect(client.fetchDailySummaries).not.toHaveBeenCalled();
  });

  it('unknown symbol: not-found warning naming the symbol', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockRejectedValueOnce(new ApiError('notFound', 'nope'));

    await searchFor(user, 'zzzz');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "No results found for ZZZZ. Check the Symbol's spelling and try again.",
    );
    expectPlaceholders();
  });

  it('valid symbol with no trades: no-data warning', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValueOnce([]);

    await searchFor(user, 'HALT');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No trading data found for HALT in the last 30 days.',
    );
    expectPlaceholders();
  });

  it('a successful search clears a previous warning', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, '');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await searchFor(user, 'TSLA');

    await screen.findByRole('button', { name: /Trading day/ });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
