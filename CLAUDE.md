# CLAUDE.md

Guidance for AI assistants working in this repository. Read this before writing code.

## Project

"Symbol Tracker": a full-stack take-home assessment. A Node/TypeScript backend wraps Yahoo Finance's 15-minute chart API and returns per-day aggregates for the last rolling 30 days. A React frontend shows them as individually rendered cells. Reviewers grade code quality **and** AI collaboration. Treat everything as production-bound MVP code whose requirements will grow.

Layout: `backend/` and `frontend/`, each with its own `setup.md`. Root has `README.md`, `PROMPT_LOG.md`, this file, and `Mockups for Symbol Search App/` (the UI source of truth).

## Locked decisions (do not re-litigate)

**API contract**
- Response: array of `{ day: "YYYY-MM-DD", lowAverage, highAverage, volume }`, ascending by day.
- `lowAverage` / `highAverage` = mean of the 15m bars' low / high per day.
- Prices: compute in `double`, round to 8 decimals, **then ceiling** at 4 decimals. Guards against float noise (e.g. `40.0001 * 10000 === 400001.00000000006`). Implemented as `Math.ceil(Math.round(x * 1e8) / 1e4) / 1e4`.
- `volume` = integer sum of bars per day.
- Null bars are dropped before any math.

**Data window and grouping**
- Window: rolling 30 days, starting at midnight in the exchange timezone (Yahoo `meta.exchangeTimezoneName`) 30 calendar days back, through today: 31 calendar dates. It is a constant in `appConfig.ts`, not an env var, because the UI copy names it.
- Days are grouped in exchange-local time, not UTC.
- The in-progress day is included. Extended hours are excluded (Yahoo default).

**Errors and caching**
- Errors: RFC 7807 problem details.
- Provider abstraction with a capped retry count and a timeout.
- 2-minute in-memory cache, not stale-served (it simply expires).
- Canned data is for the **unit test suite only** (real API preferred, canned when unavailable). It is never a runtime fallback.

**Frontend behavior**
- One fetch returns all 30 days; date selection is client-side.
- No auto-polling. Every search queries the API, and the backend's 2-minute cache decides freshness. The frontend has no TTL of its own, so the two caches cannot stack (decided in review, Entry 33).
- Cells: Day, Volume, Low Average, High Average, each its own component.
- Indicators on Volume / Low / High vs the latest day: green up if higher, red down if lower, grey circle if within 1% (`|selected - latest| / latest <= 1%`). The latest day shows none.
- Date picker: npm library (react-day-picker). Disable weekends, holidays (days absent from the response) and anything outside the window. Defaults to the latest day.
- Date display: `Jan 1st, 1999`. No times or timezones in the UI.
- Warnings: one shared Warning component. Unreachable API shows "Error: Symbol API currently unreachable" and keeps the last good data in-session. After a refresh during an outage, cells show "---". Invalid symbol and malformed input get separate warnings.
- All imagery (logo, arrows, indicators) is colored SVG. Add WAI-ARIA where needed. Style with CSS modules only.

**Decided during implementation and review**
- Retained data is for the **same symbol only**. It stays on screen while that symbol reloads, and after `unreachable` and `unknown` failures; `notFound` and invalid input do not retain it. Invalid input clears the cells to "---".
- User-facing copy is **user-authored** and lives in `frontend/src/content/`, pinned by exact-string tests. Never reword it without asking. A valid symbol with zero trading days shows "No trading data found for X in the last 30 days."
- Date picker is a **popover** under its trigger, on desktop and mobile. On mobile the search form fills the first toolbar row, so the trigger always starts the next row at the left edge.
- Calendar keyboard follows the WAI-ARIA date-picker pattern: arrow keys between days, Tab contained in the dialog, a visible keyboard hint, and it closes on any loss of focus, including window blur.
- Trend comparisons are a **visible caption** ("Higher than Oct 9th") with a decorative glyph, never hover-only.
- Mobile back-to-top button appears after scrolling, honors reduced motion, and moves focus to `main`.
- **Styling pass, round 1 (user-directed):** neon purple/lavender palette with mint-cyan glow; each metric cell has a drop shadow plus a thin glowing border, and enlarges 20% on hover or keyboard focus (`:focus-visible`, not mouse click). This reverses the earlier "cells are not Tab stops" rule: cells are focusable groups (`role="group"`, labelled by the label, described by the value). Grid gaps and padding are in `cqi` units sized so enlarged cells never touch each other or the page edge (see `MetricGrid.module.css`). Toolbar is left-aligned and the grid fills the main column.
- **Search button (Entry 39, revised in Entry 44):** while a search runs, a repeat of the symbol already loading is ignored, but a different symbol (or rejected input) cancels and replaces the running search. After 300 ms a spinner replaces the magnifier; the button is never disabled. The spinner stops rotating under reduced motion.
- **Table view (Entry 39, mockups `Desktop Table View.png` and `Mobile Table Layout.png`):** a "Day" / "Table" toggle, right-justified in the toolbar row, defaults to Day. The table lists every day **newest first**, with the same trend glyphs against the latest day; a visible note explains the arrows and each value's caption is read to screen readers. Columns are left-aligned, so the latest row's value (which has no glyph) never sits over the glyph of the row below (Entry 40). Desktop headers use the full field names, mobile the short ones ("Vol.", "Low Avg.", "High Avg."). The date picker is hidden in Table view. Once a search has shown data, everything but the values stays visible while data is missing (a new symbol loading, a failure, no trades), and the chosen view is kept (Entries 45-46). That covers the date picker ("---", `aria-disabled`), the Day/Table toggle, and the arrow note, which reads "Arrows compare each day with the latest day." without a date. The table shows 30 skeleton rows of "---", which shimmer while a search runs (static under reduced motion). Only the first skeleton row is announced to screen readers. Only the table panel scrolls, never the main body. Clicking a row opens that day in the Day view and shows "← Back to table" just left of the toggle on desktop, and on its own row, left-aligned under the date button, on mobile (Entry 41); it appears only when the Day view was reached from a row, and returns to the table scrolled to (and focused on) that row.
- The user does all visual and keyboard QA in their own browser; there is no headless browser. Confine styling changes to `styles/tokens.css` and the `*.module.css` files.

## Tenets

1. **Resilience.** Cover edge cases within reason. Null-guard inputs, handle anticipated exceptions with try/catch/finally, and give every branch a defined fallback. Never swallow errors silently: fall back *and* surface or log the failure with a typed error.
2. **Scalability.** Consider performance in API queries and in rendering. Build components and modules so new logic extends them without a teardown (open for extension, closed for modification).
3. **Separation of responsibilities.** Each function, class and component does one thing, and does it well. No mega-methods or mega-classes. Split work into focused helpers so bugs are easy to localize.

Beyond these, SOLID and DRY apply. (WET, "write everything twice", is the anti-pattern of DRY. I read the earlier mention of it as shorthand for DRY.)

## Conventions

- TypeScript `strict`. No `any`. Prefer small pure functions, and inject dependencies through interfaces.
- Configuration (timeouts, retry count, TTL, window size) lives in config, not magic numbers.
- Tests: unit tests for the aggregation, rounding, timezone, cache, indicator and date-format logic, plus API-level and component tests. Edge cases get explicit tests (nulls, empty data, DST, holidays, float noise).
- Validate at the boundaries only: env config (Zod), the HTTP symbol, the Yahoo payload and `filterValidBars`. Internal functions trust their callers and do not re-assert what a boundary already guarantees.
- Test each behavior at its own layer. Higher layers (service, route, `App`) check the wiring once and do not re-test boundary cases.
- Match the surrounding code's style and naming. Keep inline comments sparse and meaningful.
- **Doc blocks only where they earn their place** (revised in Entry 38). A function, method, component or hook in production source gets a doc block only when it could read as ambiguous or surprising without one: a non-obvious reason, a hidden precondition, an edge case, or a contract its callers must honor. Trivial helpers whose name and signature say everything (`sum`, `trimTrailingSlash`, a one-line comparator) get none. A block that exists uses this multi-line format, never a one-line `/** */`. `@param` and `@returns` appear only when they state a contract the name and type cannot, such as a precondition, a unit or a surprising return (revised in Entry 44). Test files are exempt.
  ```ts
  /**
   * Rocko Bishop
   * Summary of what the method does and why.
   * @param name - Only for a contract the type can't express (e.g. "must not be empty").
   */
  ```

## Process (graded)

- Append every meaningful prompt and decision to `PROMPT_LOG.md`: the prompt, why it was sent, and what was kept, changed or rejected. Record manual (non-AI) changes in its last section.
- Make no commits or pushes unless the user asks. Commit messages and PR descriptions end with the attribution lines the harness specifies.
- Ask before adding dependencies beyond those already agreed.
- Update the `setup.md` files and `README.md` as implementation lands.
