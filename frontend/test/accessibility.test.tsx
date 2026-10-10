/* Accessibility behaviors added in the step 9 pass. */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../src/api/apiError';
import { App } from '../src/App';
import { TradingDayPicker } from '../src/components/datePicker/TradingDayPicker';
import { SymbolSearchForm } from '../src/components/search/SymbolSearchForm';
import { documentTitleFor } from '../src/content/documentTitle';
import { SessionCache } from '../src/state/sessionCache';
import { isInputFailure } from '../src/state/toSearchFailure';
import { clientMock, manualClock, tslaSummaries } from './support/fixtures';

const renderApp = (): {
  user: ReturnType<typeof userEvent.setup>;
  client: ReturnType<typeof clientMock>;
} => {
  const user = userEvent.setup();
  const client = clientMock();
  const time = manualClock();
  const cache = new SessionCache({ ttlMs: 120_000, maxEntries: 10, clock: time.clock });
  render(<App dependencies={{ client, cache, clock: time.clock }} />);
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

  it.each([
    ['emptyInput', true],
    ['malformedInput', true],
    ['notFound', true],
    ['noData', false],
    ['unreachable', false],
    ['unknown', false],
  ] as const)('isInputFailure(%s) is %s', (kind, expected) => {
    expect(isInputFailure({ kind })).toBe(expected);
  });

  it('SymbolSearchForm omits the error attributes when valid', () => {
    render(<SymbolSearchForm onSearch={vi.fn()} busy={false} errorMessageId="msg" />);

    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
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

  it('formats the title with or without a symbol', () => {
    expect(documentTitleFor('NVDA')).toBe('NVDA · Symbol Tracker');
    expect(documentTitleFor(undefined)).toBe('Symbol Tracker');
  });
});

describe('popover focus', () => {
  it('closes when focus moves outside, without pulling focus back', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TradingDayPicker
          availableDays={['2026-10-08', '2026-10-09']}
          selectedDay="2026-10-09"
          onSelectDay={vi.fn()}
        />
        <button type="button">elsewhere</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: /Trading day/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    screen.getByRole('button', { name: 'elsewhere' }).focus();

    expect(await screen.findByRole('button', { name: 'elsewhere' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
