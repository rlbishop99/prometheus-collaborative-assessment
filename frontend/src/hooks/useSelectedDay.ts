import { useCallback, useState } from 'react';

import type { DailySummaries, DailySummary, DayKey } from '../domain/types';

export interface SelectedDay {
  /** The selected summary, or undefined when there is no data. */
  readonly selected: DailySummary | undefined;
  /** The latest (in-progress) day: the comparison baseline. */
  readonly latest: DailySummary | undefined;
  readonly selectDay: (day: DayKey) => void;
  /** Returns to the default (latest day), e.g. when a new search starts. */
  readonly resetSelection: () => void;
}

/**
 * Rocko Bishop
 * Tracks the user's chosen day within the current summaries. It defaults to the latest day, and
 * falls back to it whenever the choice is absent from the data, so the selection can never point
 * at a day that is not on screen.
 */
export function useSelectedDay(summaries: DailySummaries): SelectedDay {
  const [chosenDay, setChosenDay] = useState<DayKey | null>(null);

  const latest = summaries.at(-1);
  const chosen = chosenDay === null ? undefined : summaries.find((s) => s.day === chosenDay);

  const selectDay = useCallback((day: DayKey) => {
    setChosenDay(day);
  }, []);
  const resetSelection = useCallback(() => {
    setChosenDay(null);
  }, []);

  return { selected: chosen ?? latest, latest, selectDay, resetSelection };
}
