import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDelayedFlag } from '../../src/hooks/useDelayedFlag';

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('turns true only after the flag has held for the delay', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 300));

    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it('never turns true for a flag shorter than the delay', () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 300), {
      initialProps: { active: true },
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ active: false });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(false);
  });

  it('turns false at once, and waits the full delay again next time', () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 300), {
      initialProps: { active: true },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender({ active: false });
    expect(result.current).toBe(false);

    rerender({ active: true });
    expect(result.current).toBe(false);
  });
});
