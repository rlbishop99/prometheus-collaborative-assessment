/** User-facing text for the Day/Table views and the controls that switch between them. */
export const viewCopy = Object.freeze({
  toggleLabel: 'View',
  day: 'Day',
  table: 'Table',
  backToTable: 'Back to table',
  tableLabel: 'Daily summaries',
  openDayHint: 'Opens this day in the Day view.',
});

/** Names the latest day when there is one; without data, the note stays in place generically. */
export function comparisonNoteFor(latestLabel: string | undefined): string {
  return latestLabel
    ? `Arrows compare each day with ${latestLabel}, the latest day.`
    : 'Arrows compare each day with the latest day.';
}
