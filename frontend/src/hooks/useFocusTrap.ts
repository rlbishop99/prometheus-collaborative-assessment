import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Elements reachable with Tab. Roving-tabindex widgets expose only their current item. */
const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

/**
 * Rocko Bishop
 * Keeps Tab and Shift+Tab cycling inside `containerRef` while `active`, as the WAI-ARIA dialog
 * pattern recommends. Widgets inside keep their own arrow-key handling; only Tab is intercepted.
 * @param containerRef - The dialog element.
 * @param active - Whether the trap is engaged (e.g. while a popover is open).
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') {
        cycleFocus(event, tabbableWithin(container));
      }
    };
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
    };
  }, [containerRef, active]);
}

/**
 * Rocko Bishop
 * Lists the elements inside a container that Tab can currently reach, in DOM order.
 * @param container - The element to search.
 * @returns Tabbable descendants (excluding `tabindex="-1"` and `aria-disabled` controls).
 */
export function tabbableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && element.getAttribute('aria-disabled') !== 'true',
  );
}

/**
 * Rocko Bishop
 * Moves focus to the next or previous tabbable element, wrapping at either end. With a single
 * tabbable element, focus simply stays put.
 * @param event - The Tab keydown event (Shift reverses direction).
 * @param tabbables - Tabbable elements in DOM order.
 */
function cycleFocus(event: KeyboardEvent, tabbables: readonly HTMLElement[]): void {
  const first = tabbables[0];
  const last = tabbables.at(-1);
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const current = document.activeElement;
  if (event.shiftKey && (current === first || !tabbables.includes(current as HTMLElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (current === last || !tabbables.includes(current as HTMLElement))) {
    event.preventDefault();
    first.focus();
  }
}
