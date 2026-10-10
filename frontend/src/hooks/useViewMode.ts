import { useCallback, useState } from 'react';

import type { DayKey } from '../domain/types';

export type ViewMode = 'day' | 'table';

interface ViewState {
  readonly mode: ViewMode;
  /** The table row that opened the Day view; while set, "Back to table" is offered. */
  readonly openedFromRow?: DayKey;
  /** The row to bring back into view and focus when returning to the table. */
  readonly restoreRow?: DayKey;
}

export interface ViewModeControls extends ViewState {
  /** The Day/Table toggle: a deliberate switch, so the way back to a row is forgotten. */
  readonly switchTo: (mode: ViewMode) => void;
  readonly openDayFromRow: (day: DayKey) => void;
  readonly backToTable: () => void;
  /** Forgets the originating row without changing the view, e.g. when a new search starts. */
  readonly forgetRow: () => void;
}

/**
 * Rocko Bishop
 * Tracks which view is shown and how the user got there. Opening a day from a table row remembers
 * that row, so "Back to table" can return to it; any other navigation forgets it, because the back
 * button only makes sense right after a row was opened.
 */
export function useViewMode(): ViewModeControls {
  const [state, setState] = useState<ViewState>({ mode: 'day' });

  const switchTo = useCallback((mode: ViewMode) => {
    setState({ mode });
  }, []);
  const openDayFromRow = useCallback((day: DayKey) => {
    setState({ mode: 'day', openedFromRow: day });
  }, []);
  const backToTable = useCallback(() => {
    setState((current) => ({ mode: 'table', restoreRow: current.openedFromRow }));
  }, []);
  const forgetRow = useCallback(() => {
    setState((current) => ({ mode: current.mode }));
  }, []);

  return { ...state, switchTo, openDayFromRow, backToTable, forgetRow };
}
