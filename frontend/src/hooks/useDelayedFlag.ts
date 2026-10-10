import { useEffect, useState } from 'react';

/**
 * Rocko Bishop
 * Follows `active`, but only turns true once it has stayed true for `delayMs`, and turns false at
 * once. A loading indicator driven by this never flickers for responses that arrive quickly (a
 * cached API answer takes milliseconds), and only shows when the wait is noticeable.
 */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setElapsed(true);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      setElapsed(false);
    };
  }, [active, delayMs]);

  return active && elapsed;
}
