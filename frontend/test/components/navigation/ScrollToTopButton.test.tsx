import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollToTopButton } from '../../../src/components/navigation/ScrollToTopButton';

const scrollPageTo = (y: number): void => {
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    window.dispatchEvent(new Event('scroll'));
  });
};

const mockReducedMotion = (reduce: boolean): void => {
  window.matchMedia = vi.fn((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('ScrollToTopButton', () => {
  const scrollTo = vi.fn<(options: ScrollToOptions) => void>();

  beforeEach(() => {
    scrollTo.mockClear();
    // Run animation-frame callbacks immediately, so scroll checks are synchronous in tests.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    mockReducedMotion(false);
    scrollPageTo(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderButton = (): void => {
    render(
      <main id="main-content" tabIndex={-1}>
        <ScrollToTopButton focusTargetId="main-content" />
      </main>,
    );
  };

  it('is absent near the top of the page', () => {
    renderButton();

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('appears once the page is scrolled down, and hides again at the top', () => {
    renderButton();

    scrollPageTo(500);
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();

    scrollPageTo(0);
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('scrolls smoothly to the top and moves focus to the content', async () => {
    const user = userEvent.setup();
    renderButton();
    scrollPageTo(500);

    await user.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('jumps without animation when the user prefers reduced motion', async () => {
    mockReducedMotion(true);
    const user = userEvent.setup();
    renderButton();
    scrollPageTo(500);

    await user.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('stops listening to scroll events after unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollToTopButton focusTargetId="x" />);

    unmount();

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
