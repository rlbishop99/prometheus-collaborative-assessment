import { describe, expect, it } from 'vitest';

import { metricLabels, shortMetricLabels } from '../../src/content/metricLabels';
import { comparisonNoteFor, viewCopy } from '../../src/content/viewCopy';

describe('view copy', () => {
  it('uses the agreed wording', () => {
    expect(viewCopy).toEqual({
      toggleLabel: 'View',
      day: 'Day',
      table: 'Table',
      backToTable: 'Back to table',
      tableLabel: 'Daily summaries',
      openDayHint: 'Opens this day in the Day view.',
    });
    expect(comparisonNoteFor('Oct 9th')).toBe(
      'Arrows compare each day with Oct 9th, the latest day.',
    );
    expect(comparisonNoteFor(undefined)).toBe('Arrows compare each day with the latest day.');
  });

  it('names the columns in full, and briefly for narrow screens', () => {
    expect(Object.values(metricLabels)).toEqual(['Day', 'Volume', 'Low Average', 'High Average']);
    expect(Object.values(shortMetricLabels)).toEqual(['Day', 'Vol.', 'Low Avg.', 'High Avg.']);
  });
});
