import 'react-day-picker/style.css';

import { useId } from 'react';
import type { ReactNode } from 'react';
import { DayPicker } from 'react-day-picker';

import { datePickerCopy } from '../../content/datePickerCopy';
import { dayKeyToLocalDate, localDateToDayKey } from '../../domain/dayKey';
import { formatDay } from '../../domain/formatDay';
import type { DayKey } from '../../domain/types';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePopover } from '../../hooks/usePopover';
import { EmptyValue } from '../feedback/EmptyValue';
import { CalendarIcon } from '../icons/CalendarIcon';
import styles from './TradingDayPicker.module.css';

interface TradingDayPickerProps {
  /** Days that have data, ascending. Every other day is disabled. */
  readonly availableDays: readonly DayKey[];
  /** Undefined while there is no data: the trigger shows "---" and opens nothing. */
  readonly selectedDay: DayKey | undefined;
  readonly onSelectDay: (day: DayKey) => void;
}

/**
 * Rocko Bishop
 * A trigger that opens a calendar popover. Only days present in the data are selectable, which
 * excludes weekends, holidays and out-of-window days without a hard-coded calendar. Without data
 * the trigger is `aria-disabled` rather than `disabled`, so it stays focusable and named.
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
  // At most about 22 trading days, so these are recomputed on each render rather than memoized.
  const bounds = computeBounds(availableDays);
  const available = new Set(availableDays);
  const selectedDate = selectedDay === undefined ? undefined : dayKeyToLocalDate(selectedDay);
  const canOpen = selectedDate !== undefined && bounds !== undefined;

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
        aria-expanded={isOpen && canOpen}
        aria-controls={isOpen && canOpen ? panelId : undefined}
        aria-disabled={canOpen ? undefined : true}
        onClick={canOpen ? toggle : undefined}
      >
        <CalendarIcon size={20} />
        {/* The explicit space keeps the accessible name from collapsing to "day:Oct". */}
        <span className="visually-hidden">{datePickerCopy.triggerPrefix}</span>{' '}
        <span>{selectedDay === undefined ? <EmptyValue /> : formatDay(selectedDay)}</span>
      </button>
      {isOpen && canOpen ? (
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

function computeBounds(availableDays: readonly DayKey[]): { first: Date; last: Date } | undefined {
  const firstDay = availableDays[0];
  const lastDay = availableDays.at(-1);
  if (firstDay === undefined || lastDay === undefined) {
    return undefined;
  }
  return { first: dayKeyToLocalDate(firstDay), last: dayKeyToLocalDate(lastDay) };
}
