# Symbol Tracker

Repo for the Prometheus Group Take Home AI Collaboration Assessment.

Symbol Tracker is a full-stack app that looks up a stock symbol, pulls the last 30 days of **15-minute intraday bars** from Yahoo Finance, and summarizes them **per trading day**: average low, average high and total volume. The UI has two views: a **Day** view showing one day in four cells, with a date picker for any trading day in the window, and a **Table** view listing every day, newest first. Either way, each value is compared with the latest (in-progress) day.

- **Backend:** Node.js 22+ / TypeScript, Fastify, Zod
- **Frontend:** React 19 / TypeScript, Vite, CSS modules, react-day-picker
- **Tooling:** npm workspaces, Vitest (backend and frontend), ESLint (type-aware, strict), Prettier

---

## Quick start

**Prerequisites:** Node.js **22.12 or newer** (`node --version`), npm 10+, and internet access to `query1.finance.yahoo.com`.

```bash
npm install     # installs both workspaces from the repo root
npm run dev     # API on http://127.0.0.1:3000, UI on http://localhost:5173
```

Open **http://localhost:5173** and search a symbol such as `TSLA`, `AAPL`, `BRK.B` or `^GSPC`. In development the UI proxies `/api` to the backend, so no CORS setup is needed.

| Command (repo root) | What it does |
|---|---|
| `npm run dev` | Both apps with hot reload (`dev:backend` / `dev:frontend` run one) |
| `npm test` | All offline tests in both workspaces |
| `npm run test:contract` | The live Yahoo contract test (needs the network) |
| `npm run lint` | ESLint across the repo |
| `npm run typecheck` | `tsc --noEmit` in both workspaces |
| `npm run format:check` | Prettier check |
| `npm run build` | Production build of both apps |
| `npm start` | Runs the production build (API plus static preview server on http://localhost:4173) |

Per-app details, including every configuration variable, are in [`backend/setup.md`](backend/setup.md) and [`frontend/setup.md`](frontend/setup.md).

---

## API

### `GET /api/v1/stocks/{symbol}/daily-summary`

Returns the per-day summary for the rolling 30-day window, ascending by day, in the format and precision required by the brief:

```bash
curl http://127.0.0.1:3000/api/v1/stocks/MSFT/daily-summary
```

```json
[
  { "day": "2026-09-10", "lowAverage": 490.8635, "highAverage": 492.4059, "volume": 10336916 },
  { "day": "2026-09-11", "lowAverage": 494.863, "highAverage": 496.4476, "volume": 12839957 }
]
```

(The first two entries of a real response captured on 2026-10-10.)

Errors are [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) `application/problem+json`:

| Status | `type` | When |
|---|---|---|
| 400 | `/problems/invalid-symbol` | Symbol is not 1-15 characters of `A-Z 0-9 . - ^ =` |
| 404 | `/problems/symbol-not-found` | Yahoo has no such symbol |
| 502 | `/problems/upstream-bad-response` | Yahoo responded with something unusable |
| 503 | `/problems/upstream-unavailable` | Yahoo unreachable after a timeout and capped retries |
| 500 | `about:blank` | Unexpected error (details are logged, never returned) |

For the 502 and 503 problems, `detail` is a fixed sentence; Yahoo's own error text and schema issues go to the server log only.

`GET /health` is a liveness probe that does not call Yahoo.

---

## How the brief's open questions were resolved

The brief leaves several behaviors undefined. Each was raised during planning and decided explicitly (see `PROMPT_LOG.md`, entries 3-9):

| Question | Decision |
|---|---|
| What are `lowAverage` / `highAverage`? | Mean of the day's 15-minute bar lows / highs |
| "Last month" | Rolling 30 days, starting at **midnight in the exchange's timezone** 30 calendar days ago and running through today. That spans 31 calendar dates (today is included), of which about 21 are trading days |
| Day boundaries | Grouped in the exchange's local timezone (from Yahoo's `exchangeTimezoneName`), not UTC, so DST is handled |
| Missing data | Bars with null or invalid values are dropped before any math; days with no valid bars are omitted |
| Precision | Computed in `double`, rounded **once** at the end: round to 8 decimals (strips float noise), then **ceiling** to 4 decimals |
| Volume | Integer sum of the day's bars |
| Today | The in-progress day is included; extended-hours bars are excluded |
| Ordering | Ascending by day |
| Caching | 2-minute TTL per symbol, on the backend only. The UI asks the API on every search (it never polls), so a single cache decides freshness and data is never more than 2 minutes old |
| Outages | While a re-search loads, and if it then fails, the UI keeps that symbol's last good data; on failure it shows "Error: Symbol API currently unreachable" |
| Data missing on screen | Before the first search, only the search form and "---" cells show. Once a search has shown data, the layout stays put while data is missing (a new symbol loading, a failure, a symbol with no trades): the date picker shows "---" and can't be opened, the Day/Table toggle and the chosen view stay, the table's arrow note becomes "Arrows compare each day with the latest day.", and the table shows 30 rows of "---" that shimmer while a search runs |

Two findings from probing the live API shaped the backend. Yahoo's default range for `interval=15m` is **1 day**, so the brief's sample request never returns a month and the API always sends an explicit `period1`/`period2`. Yahoo also rejects requests without a browser User-Agent (HTTP 429).

---

## Architecture

```
React UI ──fetch /api──▶ Fastify route ──▶ DailySummaryService ──▶ MarketDataProvider (Yahoo)
   │                          │                  │   │
 last good data          RFC 7807          TTL cache  in-flight request coalescing
 (per tab, no TTL)       error handler     (2 min)    (one upstream call per symbol at a time)
```

**Backend (`backend/src`)** is layered so each part has one job and depends only on abstractions:

- `domain/`: pure business logic with no I/O (timezone day keys, the 30-day window, null filtering, aggregation, rounding).
- `providers/`: the `MarketDataProvider` interface, plus the Yahoo implementation (request builder, Zod schema, response mapper). Swapping data vendors touches only this folder.
- `infra/`: vendor-neutral fetch with a per-attempt timeout and capped, jittered retries (honoring `Retry-After`); an async `Cache` interface with a bounded in-memory TTL cache, ready to be swapped for Redis; request coalescing; clock; logger.
- `services/`: `DailySummaryService` orchestrates parse → cache → coalesce → fetch → aggregate.
- `http/` and `app.ts`: routes, response serialization schema, and global problem-details error handling.
- `container.ts` (composition root) and `server.ts` (config, listen, graceful shutdown).

**Frontend (`frontend/src`):**

- `api/`: typed client with Zod validation and error classification.
- `state/`: a pure reducer state machine and the session cache (each symbol's last good data, shown while it reloads and during outages).
- `hooks/`: `useSymbolSearch` (validation, cache, cancellation, retained data) plus small UI hooks.
- `domain/`: formatting and trend logic.
- `components/`: presentational components, one per concern (each metric is its own cell component; the table, the Day/Table toggle and the back button have their own).
- `content/`: all user-facing copy.

A search flows through the layers in one direction: `SymbolSearchForm` → `useSymbolSearch` (validates, fetches, remembers successes in the session cache) → `searchReducer` (state machine) → `selectDisplay` (what to show) → the metric cells and `WarningBanner`, whose text comes from `content/warningMessages.ts`. Failure rules (which failures keep data, which flag the input) live together in `state/toSearchFailure.ts`.

Design tokens in `styles/tokens.css` drive every color and spacing value: a neon purple/lavender theme with mint-cyan glow accents, in dark and light variants.

**Quality bar applied throughout** (`CLAUDE.md`):

- Small single-purpose functions and classes.
- Dependency injection for anything with side effects.
- Strict TypeScript with no `any`.
- Every anticipated failure handled with a defined fallback, but never swallowed silently.

---

## Testing

385 offline tests (172 backend, 213 frontend), plus one live contract test. Each behavior is tested at its own layer; higher layers check the wiring once rather than re-testing edge cases.

- **Backend:**
  - Unit tests for every domain function: float-noise rounding, DST and UTC-midnight boundaries, nulls, window edges.
  - Retry and timeout timing, plus cache TTL boundaries and coalescing.
  - Route tests for every status code.
  - Full-stack tests through the real container with only the network and clock stubbed.
- **Contract test** (`npm run test:contract`, kept out of `npm test` because it needs the network): calls the **real** Yahoo API and falls back to a canned capture in `backend/test/fixtures` **only** if Yahoo is unreachable, so schema drift is still caught. Force the offline path with `CONTRACT_YAHOO_BASE_URL=http://127.0.0.1:9 npm run test:contract`.
- **Frontend:**
  - Client error mapping, the reducer and the session cache.
  - Hook flows, including stale-response races.
  - Components, plus end-to-end `App` flows for every mockup state.
  - Keyboard behavior of the date picker.

Every UI change was also checked manually in a browser (desktop, mobile width, keyboard), and several issues were found and fixed that way. See below.

---

## Accessibility

- Semantic landmarks, a skip link, and a single `h1`.
- Each metric cell is a keyboard-focusable group named by its label and described by its value, inside a named live region; hover or focus enlarges it.
- Warnings use `role="alert"`; input errors set `aria-invalid` and `aria-describedby`.
- The calendar dialog follows the WAI-ARIA pattern (arrow keys between days, Tab contained, closes on any loss of focus) and has a visible keyboard hint.
- Trend comparisons are visible text, not color or hover alone: a caption in the Day view, and a note above the table (with each value's caption read to screen readers).
- The table has real row and column headers. Each row's date is a button, so rows are reachable by keyboard. Returning from a day puts focus back on its row.
- The Day/Table toggle is a named group of `aria-pressed` buttons. While a search runs, the form is `aria-busy` and the search button shows a spinner, but it stays usable so a different symbol can replace the search.
- Missing values are shown as "---" but read as "No data". Without data, the date picker is `aria-disabled` (still focusable and named), and only the first of the table's 30 placeholder rows is announced.
- Reduced-motion is respected (spinner, table shimmer, scrolling), and all imagery is SVG with appropriate labelling.

---

## AI collaboration

This project was built in collaboration with Claude (Claude Code). The deliverables the brief asks for:

- **[`PROMPT_LOG.md`](PROMPT_LOG.md)**: every prompt, why it was sent, and what was kept, changed or rejected. It opens with a **Human review checkpoints** table summarizing where my review changed the outcome: spec decisions I made, AI proposals I rejected, copy I rewrote, and bugs I found in manual QA.
- **Manual changes**: the final section of `PROMPT_LOG.md` describes changes made outside the AI and why.
- **[`CLAUDE.md`](CLAUDE.md)**: the development tenets and locked decisions the AI was required to follow.
- **Doc-block tag:** doc blocks appear only where a function could otherwise read as ambiguous, and each opens with `Rocko Bishop`, the contributor of record who reviewed and approved it. It does not mean the function was hand-written; most code was drafted by the AI, as `PROMPT_LOG.md` records.

---

## Known limitations and next steps

- **Unofficial data source.** Yahoo's chart API is undocumented and may change or rate-limit. The schema validation and the contract test make drift visible, and the provider interface makes replacing it a contained change.
- **Accepted layering shortcut.** `domain/symbol.ts` throws `InvalidSymbolError`, an application error that carries its HTTP status, so the domain layer is not fully HTTP-agnostic. A second consumer (a CLI or a queue worker) would warrant a domain-level error mapped at the HTTP edge. For one HTTP API it would only add a translation step.
- **Single-instance cache.** The cache is in-process. For multiple API instances, implement the existing `Cache` interface over Redis.
- **Not yet added for public deployment:** rate limiting, security headers (e.g. `@fastify/helmet`) and request metrics.
- **Bundle size.** The date picker (with `date-fns`) is most of the 120 KB gzipped JS. It is only needed after a search, so it could be lazy-loaded.
- **Browser coverage.** Visual QA was done in a Chromium-based browser. The layout relies on container queries (`cqi`/`cqb`), `:has()` and `100dvh`, so Safari and Firefox should be checked before release.
- **No browser E2E suite.** Automated UI tests run in jsdom. A Playwright suite would add coverage of real layout.
