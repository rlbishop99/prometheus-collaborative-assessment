import { useEffect } from 'react';

/**
 * Rocko Bishop
 * Keeps the browser tab title in sync with what is on screen. The title is the first thing a
 * screen reader announces and how users tell tabs apart, so it should name the viewed symbol.
 * @param title - The full document title to apply.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
