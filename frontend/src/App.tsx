import { useCallback, useId, useState } from 'react';
import type { ReactNode } from 'react';

import styles from './App.module.css';
import { createAppDependencies } from './appDependencies';
import { TradingDayPicker } from './components/datePicker/TradingDayPicker';
import { WarningBanner } from './components/feedback/WarningBanner';
import { AppShell, MAIN_CONTENT_ID } from './components/layout/AppShell';
import { MetricGrid } from './components/metrics/MetricGrid';
import { ScrollToTopButton } from './components/navigation/ScrollToTopButton';
import { SymbolSearchForm } from './components/search/SymbolSearchForm';
import { SummaryTable } from './components/table/SummaryTable';
import { BackToTableButton } from './components/view/BackToTableButton';
import { ViewToggle } from './components/view/ViewToggle';
import { documentTitleFor } from './content/documentTitle';
import { layoutCopy } from './content/layoutCopy';
import { warningMessageFor } from './content/warningMessages';
import type { DailySummaries, DayKey } from './domain/types';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useLatchedFlag } from './hooks/useLatchedFlag';
import { useSelectedDay } from './hooks/useSelectedDay';
import { useSymbolSearch } from './hooks/useSymbolSearch';
import type { SymbolSearchDeps } from './hooks/useSymbolSearch';
import { useViewMode } from './hooks/useViewMode';
import { selectDisplay } from './state/selectDisplay';
import { isInputFailure } from './state/toSearchFailure';

const NO_SUMMARIES: DailySummaries = [];

interface AppProps {
  /** Injected in tests; production builds the real dependencies once. */
  readonly dependencies?: SymbolSearchDeps;
}

/**
 * Rocko Bishop
 * Root component: wires the hooks to the presentational components and holds no business rules.
 * The picker and view controls appear with the first trading days and then stay for the session.
 */
export function App({ dependencies }: AppProps): ReactNode {
  const [deps] = useState(() => dependencies ?? createAppDependencies());
  const warningId = useId();
  const { state, search } = useSymbolSearch(deps);
  const display = selectDisplay(state);
  const summaries = display.data?.summaries ?? NO_SUMMARIES;
  const { selected, latest, selectDay, resetSelection } = useSelectedDay(summaries);
  const availableDays = summaries.map((summary) => summary.day);
  const inputInvalid = display.warning ? isInputFailure(display.warning) : false;
  const showControls = useLatchedFlag(latest !== undefined);
  const view = useViewMode();
  const { forgetRow, openDayFromRow } = view;

  useDocumentTitle(documentTitleFor(display.data?.symbol));

  const handleSearch = useCallback(
    (rawInput: string) => {
      if (search(rawInput)) {
        resetSelection();
        forgetRow();
      }
    },
    [resetSelection, forgetRow, search],
  );

  const handleOpenDay = useCallback(
    (day: DayKey) => {
      selectDay(day);
      openDayFromRow(day);
    },
    [selectDay, openDayFromRow],
  );

  return (
    <AppShell title={layoutCopy.pageTitle}>
      <div className={styles.toolbar}>
        <SymbolSearchForm
          onSearch={handleSearch}
          busy={display.loading}
          invalid={inputInvalid}
          errorMessageId={warningId}
        />
        {showControls && view.mode === 'day' ? (
          <TradingDayPicker
            availableDays={availableDays}
            selectedDay={selected?.day}
            onSelectDay={selectDay}
          />
        ) : null}
        {display.warning ? (
          <div className={styles.warning}>
            <WarningBanner id={warningId} message={warningMessageFor(display.warning)} />
          </div>
        ) : null}
        {showControls ? (
          <div className={styles.viewControls}>
            {view.mode === 'day' && view.openedFromRow !== undefined ? (
              <div className={styles.backSlot}>
                <BackToTableButton onBack={view.backToTable} />
              </div>
            ) : null}
            <div className={styles.toggleSlot}>
              <ViewToggle mode={view.mode} onChange={view.switchTo} />
            </div>
          </div>
        ) : null}
      </div>
      {view.mode === 'table' ? (
        <SummaryTable
          summaries={summaries}
          latest={latest}
          busy={display.loading}
          onOpenDay={handleOpenDay}
          restoreRow={view.restoreRow}
        />
      ) : (
        <MetricGrid selected={selected} latest={latest} busy={display.loading} />
      )}
      <ScrollToTopButton focusTargetId={MAIN_CONTENT_ID} />
    </AppShell>
  );
}
