import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DailySummaries } from '../../src/domain/types';
import { useSelectedDay } from '../../src/hooks/useSelectedDay';
import { nvdaSummaries, tslaSummaries } from '../support/fixtures';

describe('useSelectedDay', () => {
  it('defaults to the latest day', () => {
    const { result } = renderHook(() => useSelectedDay(tslaSummaries));

    expect(result.current.selected?.day).toBe('2026-10-09');
    expect(result.current.latest?.day).toBe('2026-10-09');
  });

  it('selects an earlier day while keeping the latest as the baseline', () => {
    const { result } = renderHook(() => useSelectedDay(tslaSummaries));

    act(() => {
      result.current.selectDay('2026-10-07');
    });

    expect(result.current.selected?.day).toBe('2026-10-07');
    expect(result.current.latest?.day).toBe('2026-10-09');
  });

  it('returns to the latest day on reset', () => {
    const { result } = renderHook(() => useSelectedDay(tslaSummaries));
    act(() => {
      result.current.selectDay('2026-10-07');
    });

    act(() => {
      result.current.resetSelection();
    });

    expect(result.current.selected?.day).toBe('2026-10-09');
  });

  it('falls back to the latest day when the chosen day is not in new data', () => {
    const { result, rerender } = renderHook(({ data }) => useSelectedDay(data), {
      initialProps: { data: tslaSummaries },
    });
    act(() => {
      result.current.selectDay('2026-10-07');
    });

    rerender({ data: nvdaSummaries });

    expect(result.current.selected?.day).toBe('2026-10-09');
  });

  it('selects nothing when there is no data', () => {
    const empty: DailySummaries = [];
    const { result } = renderHook(() => useSelectedDay(empty));

    expect(result.current.selected).toBeUndefined();
    expect(result.current.latest).toBeUndefined();
  });
});
