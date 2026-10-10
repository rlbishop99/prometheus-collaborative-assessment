import type { DailySummary } from './types';

/** A field of the daily summary; each is shown as a Day-view cell and as a table column. */
export type MetricField = keyof DailySummary;

/** Display order of the fields, matching the Day-view cells, the table columns and the mockups. */
export const METRIC_FIELDS: readonly MetricField[] = ['day', 'volume', 'lowAverage', 'highAverage'];
