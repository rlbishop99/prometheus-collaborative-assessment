import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useViewMode } from '../../src/hooks/useViewMode';

describe('useViewMode', () => {
  it('starts in the Day view with no row to return to', () => {
    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('day');
    expect(result.current.openedFromRow).toBeUndefined();
  });

  it('remembers the row that opened the Day view, and restores it on the way back', () => {
    const { result } = renderHook(() => useViewMode());
    act(() => {
      result.current.switchTo('table');
    });

    act(() => {
      result.current.openDayFromRow('2026-10-07');
    });
    expect(result.current).toMatchObject({ mode: 'day', openedFromRow: '2026-10-07' });

    act(() => {
      result.current.backToTable();
    });
    expect(result.current).toMatchObject({ mode: 'table', restoreRow: '2026-10-07' });
    expect(result.current.openedFromRow).toBeUndefined();
  });

  it('forgets the row when the toggle is used', () => {
    const { result } = renderHook(() => useViewMode());
    act(() => {
      result.current.openDayFromRow('2026-10-07');
    });

    act(() => {
      result.current.switchTo('day');
    });

    expect(result.current.openedFromRow).toBeUndefined();
  });

  it('forgets the row without changing the view, e.g. on a new search', () => {
    const { result } = renderHook(() => useViewMode());
    act(() => {
      result.current.openDayFromRow('2026-10-07');
    });

    act(() => {
      result.current.forgetRow();
    });

    expect(result.current.mode).toBe('day');
    expect(result.current.openedFromRow).toBeUndefined();
  });
});
