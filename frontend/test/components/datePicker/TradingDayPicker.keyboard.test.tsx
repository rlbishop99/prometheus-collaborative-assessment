/* Keyboard and focus behavior of the picker, from the step 9 keyboard QA round. */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TradingDayPicker } from '../../../src/components/datePicker/TradingDayPicker';
import { tabbableWithin } from '../../../src/hooks/useFocusTrap';

const ONE_MONTH = ['2026-10-01', '2026-10-02', '2026-10-08', '2026-10-09'];
const TWO_MONTHS = ['2026-09-10', '2026-10-08', '2026-10-09'];

const openPicker = async (availableDays: string[]): Promise<ReturnType<typeof userEvent.setup>> => {
  const user = userEvent.setup();
  render(
    <>
      <TradingDayPicker
        availableDays={availableDays}
        selectedDay="2026-10-09"
        onSelectDay={vi.fn()}
      />
      <button type="button">next control</button>
    </>,
  );
  await user.click(screen.getByRole('button', { name: /Trading day/ }));
  return user;
};

const dialog = (): HTMLElement => screen.getByRole('dialog', { name: 'Choose a trading day' });

describe('TradingDayPicker keyboard behavior', () => {
  it('shows a keyboard hint that also describes the dialog', async () => {
    await openPicker(ONE_MONTH);

    expect(screen.getByText('Use arrow keys to choose a day. Esc to close.')).toBeVisible();
    expect(dialog()).toHaveAccessibleDescription('Use arrow keys to choose a day. Esc to close.');
  });

  it('focuses the selected day on open and moves between days with arrow keys', async () => {
    const user = await openPicker(ONE_MONTH);
    expect(screen.getByRole('button', { name: /October 9th, 2026/ })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(screen.getByRole('button', { name: /October 8th, 2026/ })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside when the day grid is the only stop', async () => {
    const user = await openPicker(ONE_MONTH);
    const day = screen.getByRole('button', { name: /October 9th, 2026/ });

    await user.tab();
    expect(day).toHaveFocus();
    await user.tab({ shift: true });
    expect(day).toHaveFocus();
    expect(dialog()).toBeInTheDocument();
  });

  it('cycles Tab between the month arrow and the day grid when both are available', async () => {
    const user = await openPicker(TWO_MONTHS);
    const day = screen.getByRole('button', { name: /October 9th, 2026/ });
    const previous = screen.getByRole('button', { name: /previous month/i });

    await user.tab();
    expect(previous).toHaveFocus();
    await user.tab();
    expect(day).toHaveFocus();
    await user.tab({ shift: true });
    expect(previous).toHaveFocus();
    await user.tab({ shift: true });
    expect(day).toHaveFocus();
  });

  it('never lets Tab reach controls outside the open calendar', async () => {
    const user = await openPicker(TWO_MONTHS);

    for (let press = 0; press < 5; press++) {
      await user.tab();
      expect(dialog()).toContainElement(document.activeElement as HTMLElement);
    }
    expect(screen.getByRole('button', { name: 'next control' })).not.toHaveFocus();
  });

  it('closes when the browser window loses focus (URL bar, another app)', async () => {
    await openPicker(ONE_MONTH);

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('skips aria-disabled and tabindex="-1" controls when listing tab stops', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>a</button>
      <button aria-disabled="true">b</button>
      <button tabindex="-1">c</button>
      <button disabled>d</button>
      <span tabindex="0">e</span>`;

    expect(tabbableWithin(container).map((el) => el.textContent)).toEqual(['a', 'e']);
  });
});
