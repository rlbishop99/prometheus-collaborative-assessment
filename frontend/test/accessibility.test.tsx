/* App-level accessibility: input error linkage and the document title, through the real App. */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../src/api/apiError';
import { App } from '../src/App';
import { SessionCache } from '../src/state/sessionCache';
import { clientMock, tslaSummaries } from './support/fixtures';

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

const search = async (user: ReturnType<typeof userEvent.setup>, text: string): Promise<void> => {
  const input = screen.getByRole('textbox', { name: 'Stock symbol' });
  await user.clear(input);
  if (text) await user.type(input, text);
  await user.click(screen.getByRole('button', { name: 'Search' }));
};

describe('input error linkage', () => {
  it('marks the input invalid and describes it by the warning for input problems', async () => {
    const { user } = renderApp();

    await search(user, 'bad symbol!');

    const input = screen.getByRole('textbox', { name: 'Stock symbol' });
    const alert = await screen.findByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(alert.textContent);
  });

  it('does not blame the input for an outage', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockRejectedValueOnce(new ApiError('unreachable', 'down'));

    await search(user, 'TSLA');
    await screen.findByRole('alert');

    const input = screen.getByRole('textbox', { name: 'Stock symbol' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('clears the invalid state after a successful search', async () => {
    const { user, client } = renderApp();
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);
    await search(user, '');
    await screen.findByRole('alert');

    await search(user, 'TSLA');
    await screen.findByRole('button', { name: /Trading day/ });

    expect(screen.getByRole('textbox', { name: 'Stock symbol' })).not.toHaveAttribute(
      'aria-invalid',
    );
  });
});

describe('document title', () => {
  it('names the viewed symbol', async () => {
    const { user, client } = renderApp();
    expect(document.title).toBe('Symbol Tracker');
    client.fetchDailySummaries.mockResolvedValue(tslaSummaries);

    await search(user, 'tsla');
    await screen.findByRole('button', { name: /Trading day/ });

    expect(document.title).toBe('TSLA · Symbol Tracker');
  });
});
