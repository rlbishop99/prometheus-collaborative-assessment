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
import { documentTitleFor } from './content/documentTitle';
import { warningMessageFor } from './content/warningMessages';
import type { DailySummaries } from './domain/types';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useSelectedDay } from './hooks/useSelectedDay';
import { useSymbolSearch } from './hooks/useSymbolSearch';
import type { SymbolSearchDeps } from './hooks/useSymbolSearch';
import { selectDisplay } from './state/selectDisplay';
import { isInputFailure } from './state/toSearchFailure';

const NO_SUMMARIES: DailySummaries = [];

interface AppProps {
  /** Injected in tests; production builds the real dependencies once. */
  readonly dependencies?: SymbolSearchDeps;
}

/**
 * Rocko Bishop
 * Root component: connects the search hook, the day selection and the presentational components.
 * It holds no business rules itself; those live in hooks, state selectors and the domain layer.
 * @param props - Optional injected dependencies.
 * @returns The application UI.
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

  useDocumentTitle(documentTitleFor(display.data?.symbol));

  const handleSearch = useCallback(
    (rawInput: string) => {
      resetSelection();
      search(rawInput);
    },
    [resetSelection, search],
  );

  return (
    <AppShell title="Search">
      <div className={styles.toolbar}>
        <SymbolSearchForm
          onSearch={handleSearch}
          busy={display.loading}
          invalid={inputInvalid}
          errorMessageId={warningId}
        />
        {selected ? (
          <TradingDayPicker
            availableDays={availableDays}
            selectedDay={selected.day}
            onSelectDay={selectDay}
          />
        ) : null}
        {display.warning ? (
          <div className={styles.warning}>
            <WarningBanner id={warningId} message={warningMessageFor(display.warning)} />
          </div>
        ) : null}
      </div>
      <MetricGrid selected={selected} latest={latest} busy={display.loading} />
      <ScrollToTopButton focusTargetId={MAIN_CONTENT_ID} />
    </AppShell>
  );
}
