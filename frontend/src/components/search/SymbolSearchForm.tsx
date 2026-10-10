import { useId, useState } from 'react';
import type { ReactNode, SubmitEvent } from 'react';

import { SearchIcon } from '../icons/SearchIcon';
import styles from './SymbolSearchForm.module.css';

interface SymbolSearchFormProps {
  readonly onSearch: (rawInput: string) => void;
  readonly busy: boolean;
  /** Marks the input invalid, so assistive technology reports the problem on the field itself. */
  readonly invalid?: boolean;
  /** Id of the message explaining the problem, read out when the input is focused. */
  readonly errorMessageId?: string;
}

/**
 * Rocko Bishop
 * The symbol input and search button. It only collects text: validation and fetching belong to
 * the search hook, so this component stays reusable and trivially testable. When the caller
 * flags the input as invalid, the field links to the explanatory message.
 * @param props - The search callback, the loading flag and the optional error linkage.
 * @returns The search form.
 */
export function SymbolSearchForm({
  onSearch,
  busy,
  invalid = false,
  errorMessageId,
}: SymbolSearchFormProps): ReactNode {
  const [value, setValue] = useState('');
  const inputId = useId();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSearch(value);
  };

  return (
    <form className={styles.form} role="search" onSubmit={handleSubmit} aria-busy={busy}>
      <label htmlFor={inputId} className="visually-hidden">
        Stock symbol
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        placeholder="AAPL"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="search"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorMessageId : undefined}
      />
      <button className={styles.button} type="submit" aria-label="Search">
        <SearchIcon size={22} />
      </button>
    </form>
  );
}
