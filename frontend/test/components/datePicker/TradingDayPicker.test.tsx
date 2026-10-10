import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TradingDayPicker } from '../../../src/components/datePicker/TradingDayPicker';

// Thu Oct 1 -> Fri Oct 9, 2026, minus the weekend (3rd, 4th) and a pretend holiday (Mon 5th).
const availableDays = [
  '2026-10-01',
  '2026-10-02',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
  '2026-10-09',
];

/** Finds a calendar day button by its day-of-month, e.g. "October 6th". */
const dayButton = (dayLabel: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(`October ${dayLabel}, 2026`) });

const renderPicker = (
  onSelectDay = vi.fn(),
): { user: ReturnType<typeof userEvent.setup>; onSelectDay: typeof onSelectDay } => {
  const user = userEvent.setup();
  render(
    <>
      <TradingDayPicker
        availableDays={availableDays}
        selectedDay="2026-10-09"
        onSelectDay={onSelectDay}
      />
      <p>outside</p>
    </>,
  );
  return { user, onSelectDay };
};

describe('TradingDayPicker', () => {
  it('shows the selected day on a collapsed trigger', () => {
    renderPicker();
    const trigger = screen.getByRole('button', { name: /Trading day: Oct 9th, 2026/ });

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a labelled calendar dialog', async () => {
    const { user } = renderPicker();

    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    expect(screen.getByRole('dialog', { name: 'Choose a trading day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trading day/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('enables trading days and disables weekends, holidays and out-of-window days', async () => {
    const { user } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    for (const day of ['1st', '2nd', '6th', '7th', '8th', '9th']) {
      expect(dayButton(day)).toBeEnabled();
    }
    for (const day of ['3rd', '4th', '5th', '10th', '30th']) {
      expect(dayButton(day)).toBeDisabled();
    }
  });

  it('marks the current selection', async () => {
    const { user } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    expect(dayButton('9th')).toHaveAccessibleName(/selected/i);
  });

  it('reports the chosen day, closes, and returns focus to the trigger', async () => {
    const { user, onSelectDay } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    await user.click(dayButton('6th'));

    expect(onSelectDay).toHaveBeenCalledWith('2026-10-06');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trading day/ })).toHaveFocus();
  });

  it('ignores clicks on disabled days', async () => {
    const { user, onSelectDay } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    await user.click(dayButton('4th'));

    expect(onSelectDay).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { user } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trading day/ })).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    const { user } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    await user.click(screen.getByText('outside'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not offer navigation beyond the window', async () => {
    const { user } = renderPicker();
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    // react-day-picker uses aria-disabled (not `disabled`) so the buttons stay discoverable.
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: /next month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('allows navigating between months inside a window that spans two months', async () => {
    const user = userEvent.setup();
    render(
      <TradingDayPicker
        availableDays={['2026-09-10', '2026-10-09']}
        selectedDay="2026-10-09"
        onSelectDay={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Trading day/ }));

    await user.click(screen.getByRole('button', { name: /previous month/i }));

    expect(screen.getByRole('button', { name: /September 10th, 2026/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
