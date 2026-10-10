/** Calendar day in `YYYY-MM-DD` form, always expressed in the exchange's local timezone. */
export type DayKey = string;

/** One intraday bar as received from a provider. Any field may be missing upstream. */
export interface IntradayBar {
  /** Bar start time, in epoch seconds. */
  readonly timestamp: number;
  readonly low: number | null;
  readonly high: number | null;
  readonly volume: number | null;
}

/** A bar whose fields have all passed validation and are safe to aggregate. */
export interface ValidBar {
  readonly timestamp: number;
  readonly low: number;
  readonly high: number;
  readonly volume: number;
}

/** Provider-agnostic intraday data for a single symbol. */
export interface IntradaySeries {
  readonly symbol: string;
  /** IANA timezone of the listing exchange, e.g. `America/New_York`. */
  readonly timeZone: string;
  readonly bars: readonly IntradayBar[];
}

/** The public per-day summary. Field names and shape are fixed by the API contract. */
export interface DailySummary {
  readonly day: DayKey;
  readonly lowAverage: number;
  readonly highAverage: number;
  readonly volume: number;
}
