/*
 * End-to-end UI flows mirroring the mockups. The real hook, cache, state machine and components
 * run; only the API client and the clock are faked.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../src/api/apiError';
import { App } from '../src/App';
import { SessionCache } from '../src/state/sessionCache';
import { clientMock, manualClock, tslaSummaries } from './support/fixtures';

const TWO_MINUTES = 120_000;

const renderApp = (): {
  user: ReturnType<typeof userEvent.setup>;
  client: ReturnType<typeof clientMock>;
  time: ReturnType<typeof manualClock>;
} => {
  const user = userEvent.setup();
  const client = clientMock();
  const time = manualClock();
  const cache = new SessionCache({ ttlMs: TWO_MINUTES, maxEntries: 10, clock: time.clock });
  render(<App dependencies={{ client, cache, clock: time.clock }} />);
  return { user, client, time };
};

const searchFor = async (user: ReturnType<typeof userEvent.setup>, text: string): Promise<void> => {
  const input = screen.getByRole('textbox', { name: 'Stock symbol' });
  await user.clear(input);
  if (text) await user.type(input, text);
  await user.click(screen.getByRole('button', { name: 'Search' }));
};

const valueOf = (label: string): HTMLElement => {
  const value = screen.getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error(`No value for ${label}`);
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
    const { user, client, time } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');
    await user.click(await screen.findByRole('button', { name: /Trading day/ }));
    await user.click(screen.getByRole('button', { name: /October 7th, 2026/ }));

    time.advance(1_000);
    await searchFor(user, 'TSLA');

    expect(await screen.findByRole('button', { name: /Trading day: Oct 9th, 2026/ })).toBeVisible();
  });

  it('re-searching within 2 minutes uses the session cache', async () => {
    const { user, client, time } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await searchFor(user, 'TSLA');
    await screen.findByRole('button', { name: /Trading day/ });

    time.advance(TWO_MINUTES - 1);
    await searchFor(user, 'tsla');

    expect(client.fetchDailySummaries).toHaveBeenCalledTimes(1);
  });

  it('same-session outage: keeps the data and shows the unreachable warning', async () => {
    const { user, client, time } = renderApp();
    client.fetchDailySummaries
      .mockResolvedValueOnce(tslaSummaries)
      .mockRejectedValueOnce(new ApiError('unreachable', 'down'));
    await searchFor(user, 'TSLA');
    await screen.findByRole('button', { name: /Trading day/ });

    time.advance(TWO_MINUTES);
    await searchFor(user, 'TSLA');

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
