/** Calendar day in `YYYY-MM-DD` form, as returned by the API (exchange-local, no time part). */
export type DayKey = string;

/** One day's summary, exactly as the backend contract defines it. */
export interface DailySummary {
  readonly day: DayKey;
  readonly lowAverage: number;
  readonly highAverage: number;
  readonly volume: number;
}

/** A symbol's summaries, ascending by day. */
export type DailySummaries = readonly DailySummary[];
