import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface Popover {
  readonly isOpen: boolean;
  readonly toggle: () => void;
  /** Closes the popover and returns focus to the trigger, as a dialog should. */
  readonly close: () => void;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly panelRef: RefObject<HTMLDivElement | null>;
}

/**
 * Rocko Bishop
 * Open/close behavior for a popover: Escape or a pointer press outside the trigger and panel
 * closes it. Document listeners are attached only while the popover is open, so a closed popover
 * costs nothing.
 * @returns Open state, actions and the refs to attach.
 */
export function usePopover(): Popover {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (!isInside(target, triggerRef.current) && !isInside(target, panelRef.current)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, close]);

  return { isOpen, toggle, close, triggerRef, panelRef };
}

/**
 * Rocko Bishop
 * Null-safe containment check for event targets.
 * @param target - The event target.
 * @param container - The element that may contain it.
 * @returns True when `target` is inside `container`.
 */
function isInside(target: Node | null, container: HTMLElement | null): boolean {
  return target !== null && container !== null && container.contains(target);
}
