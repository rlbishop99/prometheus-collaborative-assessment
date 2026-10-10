import { useState } from 'react';

/**
 * Rocko Bishop
 * Turns true the first time `flag` is true and stays true for the component's lifetime. The state
 * is updated during render (React's "adjust state from props" pattern), so the latch takes effect
 * in the same render, with no flash of the unlatched value.
 */
export function useLatchedFlag(flag: boolean): boolean {
  const [latched, setLatched] = useState(flag);
  if (flag && !latched) {
    setLatched(true);
  }
  return latched || flag;
}
