import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Vitest globals are off, so Testing Library's auto-cleanup is not registered; do it explicitly.
afterEach(() => {
  cleanup();
});

// jsdom does not implement scrolling; tests that care spy on this stub.
Element.prototype.scrollIntoView = vi.fn();
