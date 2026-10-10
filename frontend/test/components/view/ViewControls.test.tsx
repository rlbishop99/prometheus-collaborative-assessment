import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BackToTableButton } from '../../../src/components/view/BackToTableButton';
import { ViewToggle } from '../../../src/components/view/ViewToggle';

describe('ViewToggle', () => {
  it('marks the current view pressed and reports the other one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewToggle mode="day" onChange={onChange} />);

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Table' }));

    expect(onChange).toHaveBeenCalledWith('table');
  });
});

describe('BackToTableButton', () => {
  it('takes focus when it appears and calls back when used', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<BackToTableButton onBack={onBack} />);

    const button = screen.getByRole('button', { name: 'Back to table' });
    expect(button).toHaveFocus();

    await user.click(button);

    expect(onBack).toHaveBeenCalledOnce();
  });
});
