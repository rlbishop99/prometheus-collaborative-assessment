import type { ReactNode } from 'react';

import { layoutCopy } from '../../content/layoutCopy';
import { useScrolledPast } from '../../hooks/useScrolledPast';
import { ScrollTopIcon } from '../icons/ScrollTopIcon';
import styles from './ScrollToTopButton.module.css';

/** Roughly one cell's height: past this, the search box is off-screen on a phone. */
const SHOW_AFTER_PX = 240;

interface ScrollToTopButtonProps {
  /** Element to focus after scrolling, so keyboard and screen-reader users land at the top too. */
  readonly focusTargetId: string;
}

/**
 * Rocko Bishop
 * The mobile "back to top" control from the mockups. It appears only once the page is scrolled
 * down (it would do nothing at the top) and is hidden on desktop via CSS. Scrolling honors the
 * user's reduced-motion preference, and focus moves to the top of the content afterwards.
 */
export function ScrollToTopButton({ focusTargetId }: ScrollToTopButtonProps): ReactNode {
  const visible = useScrolledPast(SHOW_AFTER_PX);
  if (!visible) {
    return null;
  }

  const handleClick = (): void => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    document.getElementById(focusTargetId)?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className={styles.button}
      aria-label={layoutCopy.backToTop}
      onClick={handleClick}
    >
      <ScrollTopIcon size={44} />
    </button>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
