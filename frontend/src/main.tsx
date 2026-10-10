import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

const ROOT_ELEMENT_ID = 'root';

function mount(): void {
  const container = document.getElementById(ROOT_ELEMENT_ID);
  if (!container) {
    throw new Error(`Cannot start Symbol Tracker: #${ROOT_ELEMENT_ID} element not found`);
  }
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

mount();
