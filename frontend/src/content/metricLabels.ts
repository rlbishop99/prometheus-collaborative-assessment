import type { MetricField } from '../domain/metricFields';

/** Full field names: the Day-view cell labels and the desktop table headers. */
export const metricLabels: Readonly<Record<MetricField, string>> = Object.freeze({
  day: 'Day',
  volume: 'Volume',
  lowAverage: 'Low Average',
  highAverage: 'High Average',
});

/** Narrow-screen table headers, from the mobile table mockup. Screen readers hear the full names. */
export const shortMetricLabels: Readonly<Record<MetricField, string>> = Object.freeze({
  day: 'Day',
  volume: 'Vol.',
  lowAverage: 'Low Avg.',
  highAverage: 'High Avg.',
});

/** The Day view's region name. */
export const metricGridCopy = Object.freeze({
  regionLabel: 'Daily summary',
});

/** What a missing value shows in either view, and what screen readers hear instead. */
export const emptyValueCopy = Object.freeze({
  placeholder: '---',
  spoken: 'No data',
});
