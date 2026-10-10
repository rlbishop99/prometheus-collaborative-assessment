# Frontend setup

React 19 + TypeScript UI, built with Vite. It consumes the backend's `/api/v1/stocks/{symbol}/daily-summary` endpoint.

## Prerequisites

- **Node.js 22.12 or newer** (`node --version`) and npm 10+.
- The **backend running** for live data (see [`../backend/setup.md`](../backend/setup.md)). Without it, searches show "Error: Symbol API currently unreachable", which is the intended outage behavior.

## Install

From the **repository root**, which installs every workspace:

```bash
npm install
```

## Run

```bash
# Development with hot reload, on http://localhost:5173
npm run dev --workspace frontend        # or: cd frontend && npm run dev

# Or start the API and the UI together from the repo root
npm run dev
```

In development, Vite proxies `/api` to `http://127.0.0.1:3000`, so the browser makes same-origin requests and CORS is not involved.

```bash
# Production build, then serve it locally on http://localhost:4173 (also proxies /api)
npm run build --workspace frontend
npm run preview --workspace frontend
```

## Configuration

| Variable | When read | Default | Purpose |
|---|---|---|---|
| `API_PROXY_TARGET` | dev and preview server | `http://127.0.0.1:3000` | Where `/api` is proxied, e.g. if the backend runs on another port |
| `VITE_API_BASE_URL` | build time | _(empty = same origin)_ | API origin for deployments where the UI and API are on different hosts. Add that origin to the backend's `CORS_ORIGINS`. |

Example: `API_PROXY_TARGET=http://127.0.0.1:8080 npm run dev --workspace frontend`

## Test

```bash
npm test --workspace frontend            # Vitest + jsdom + Testing Library
npm run test:coverage --workspace frontend
npm run typecheck --workspace frontend
npm run lint                             # from the repo root
```

Tests live in `frontend/test/`, mirroring `src/`. `test/App.test.tsx` walks through every mockup state end to end, with only the API client and clock faked.

## Using the app

1. Enter a symbol (case-insensitive) and press **Enter** or the search button.
2. The latest trading day appears. A date button opens a calendar in which only trading days in the 30-day window can be chosen.
3. Choosing an earlier day shows how each value compares with the latest day: green ▲ higher, red ▼ lower, grey ● within 1%, with a caption such as "Higher than Oct 9th".
4. Re-searching the same symbol within 2 minutes reuses the data already loaded. After that it is fetched again, and if the API is down the last good data stays on screen under a warning.

**Keyboard:** Tab moves between the search field, the search button, the date button and the four metric cells (a focused cell enlarges, as on hover). In the open calendar, the arrow keys move between days, Enter selects and Esc closes. On mobile, a back-to-top button appears once you scroll.

## Project layout

```
src/
  main.tsx, App.tsx     Entry point and root component (wiring only)
  appDependencies.ts    Composition root: API client, session cache, clock
  config.ts             Runtime settings (API base URL, timeouts, cache TTL)
  api/                  HTTP client, Zod schemas, error classification
  state/                Search state machine, session cache, display selector
  hooks/                useSymbolSearch, useSelectedDay, usePopover, useFocusTrap, ...
  domain/               Trend, date and number formatting, day-key conversion
  components/           layout, search, datePicker, metrics, indicators, feedback, navigation, icons
  content/              All user-facing copy
  styles/               Design tokens (light and dark) and global CSS
test/                   Mirrors src/
```
