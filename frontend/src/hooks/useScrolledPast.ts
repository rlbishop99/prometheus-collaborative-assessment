import { useEffect, useState } from 'react';

/**
 * Rocko Bishop
 * Reports whether the page is scrolled further down than `thresholdPx`. The scroll listener is
 * passive and coalesced to one check per animation frame, so scrolling stays smooth however
 * often the event fires.
 * @param thresholdPx - Scroll distance after which this returns true.
 * @returns True once the page is scrolled past the threshold.
 */
export function useScrolledPast(thresholdPx: number): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    // `pending` is set before scheduling, so coalescing stays correct even if the scheduler runs
    // the callback synchronously (as some environments and test doubles do).
    let pending = false;
    let frame: number | null = null;
    const check = (): void => {
      pending = false;
      frame = null;
      setScrolledPast(window.scrollY > thresholdPx);
    };
    const onScroll = (): void => {
      if (pending) {
        return;
      }
      pending = true;
      frame = window.requestAnimationFrame(check);
    };

    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [thresholdPx]);

  return scrolledPast;
}
