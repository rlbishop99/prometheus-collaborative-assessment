import 'react-day-picker/style.css';

import { useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { DayPicker } from 'react-day-picker';

import { datePickerCopy } from '../../content/datePickerCopy';
import { dayKeyToLocalDate, localDateToDayKey } from '../../domain/dayKey';
import { formatDay } from '../../domain/formatDay';
import type { DayKey } from '../../domain/types';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePopover } from '../../hooks/usePopover';
import { CalendarIcon } from '../icons/CalendarIcon';
import styles from './TradingDayPicker.module.css';

interface TradingDayPickerProps {
  /** Days that have data, ascending. Every other day is disabled. */
  readonly availableDays: readonly DayKey[];
  readonly selectedDay: DayKey;
  readonly onSelectDay: (day: DayKey) => void;
}

/**
 * Rocko Bishop
 * A compact trigger showing the selected day, which opens a calendar popover. Only days present
 * in the data are selectable, which disables weekends, market holidays and anything outside the
 * 30-day window with no hard-coded calendar. Month navigation is clamped to the window as well.
 * Keyboard use follows the WAI-ARIA date-picker pattern: arrow keys move between days, Tab stays
 * within the open dialog, and a visible hint explains this.
 * @param props - Available days, the current selection and the change callback.
 * @returns The picker.
 */
export function TradingDayPicker({
  availableDays,
  selectedDay,
  onSelectDay,
}: TradingDayPickerProps): ReactNode {
  const { isOpen, toggle, close, triggerRef, panelRef } = usePopover();
  useFocusTrap(panelRef, isOpen);
  const panelId = useId();
  const hintId = useId();
  const bounds = useMemo(() => computeBounds(availableDays), [availableDays]);
  const available = useMemo(() => new Set(availableDays), [availableDays]);
  const selectedDate = dayKeyToLocalDate(selectedDay);

  const handleSelect = (date: Date | undefined): void => {
    if (date) {
      onSelectDay(localDateToDayKey(date));
    }
    close();
  };

  return (
    <div className={styles.picker}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={toggle}
      >
        <CalendarIcon size={20} />
        {/* The explicit space keeps the accessible name from collapsing to "day:Oct". */}
        <span className="visually-hidden">{datePickerCopy.triggerPrefix}</span>{' '}
        <span>{formatDay(selectedDay)}</span>
      </button>
      {isOpen && bounds ? (
        <div
          ref={panelRef}
          id={panelId}
          className={styles.panel}
          role="dialog"
          aria-label={datePickerCopy.dialogLabel}
          aria-describedby={hintId}
        >
          <DayPicker
            mode="single"
            required
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
            startMonth={bounds.first}
            endMonth={bounds.last}
            disabled={[
              { before: bounds.first },
              { after: bounds.last },
              (date: Date) => !available.has(localDateToDayKey(date)),
            ]}
            autoFocus
          />
          <p id={hintId} className={styles.hint}>
            {datePickerCopy.keyboardHint}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Rocko Bishop
 * Finds the first and last selectable dates, which clamp the calendar's navigation.
 * @param availableDays - Ascending day keys.
 * @returns The bounds as local dates, or undefined when there are no days.
 */
function computeBounds(availableDays: readonly DayKey[]): { first: Date; last: Date } | undefined {
  const firstDay = availableDays[0];
  const lastDay = availableDays.at(-1);
  if (firstDay === undefined || lastDay === undefined) {
    return undefined;
  }
  return { first: dayKeyToLocalDate(firstDay), last: dayKeyToLocalDate(lastDay) };
}
