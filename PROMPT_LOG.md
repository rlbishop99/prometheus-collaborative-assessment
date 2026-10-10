# PROMPT_LOG

Log of AI prompts used during this assessment. Each entry: the prompt, why it was sent, and what was kept / changed / rejected.
Manual (non-AI) changes are recorded in the final section.

## Human review checkpoints

Every AI output was reviewed before it was committed. These are the points where my review changed the result:

| Entry | What I reviewed | My decision |
|---|---|---|
| 3-9 | Every spec ambiguity raised by the AI | I defined each rule myself (metrics, window, timezone, rounding, caching, errors, UI behavior) |
| 5 | AI's reading of "canned data" as a runtime fallback | **Rejected**: canned data is for the test suite only |
| 6 | AI's proposed backend stale-serving cache | **Rejected** to keep scope smaller; frontend retention only |
| 9 | AI's native date input plus "No trading data" fallback | **Rejected**: weekends and holidays must be disabled in the picker |
| 10 | AI's draft `CLAUDE.md` | Reviewed and approved |
| 13 | Comment style | **Added my own convention**: contributor-tagged doc block on every method |
| Manual changes | My own stray whitespace edit | Reverted after the AI flagged that it broke formatting |
| 19 | AI-drafted warning copy | **Replaced** with my own wording |
| 21 | Visual QA of the running app (5 screenshots) | **Found 3 issues**: mobile calendar clipped, logo line trending down, styling pass wanted |
| 22 | Visual QA of the AI's first mobile calendar fix | **Rejected** the bottom-sheet fix; approved the anchored fix after a second screenshot |
| 23-24 | Step 9 scroll-to-top and accessibility pass (2 screenshots plus keyboard testing) | Approved the invalid-input border and back-to-top button; **questioned** the calendar's keyboard behavior (Tab skips the days) |
| 25 | Calendar keyboard options | Chose hint plus Tab containment, **and found a bug**: tabbing to the browser URL bar left the calendar open |
| 26 | Keyboard reachability of the metric cells | **Found a gap**: the trend explanation was hover-only, invisible to sighted keyboard and touch users; chose a visible caption; asked how blind users consume the cells |
| 27 | README, setup docs and the final log pass | Reviewed and approved |
| 28 | Styling pass round 1 (annotated screenshot) | **Directed the visual design**: palette, glow, 20% growth and layout; reversed the "cells not focusable" rule |
| 29 | Desktop QA of styling round 1 | **Found** the desktop layout scrolling with the cells cut off; required all 4 cells to always fit without scrolling. Fix confirmed by my next screenshot |
| 30 | Text size inside the cells | **Requested** larger text to reduce empty space in each cell; approved after re-check |

---

## Entry 1 - Project kickoff and prework plan (2026-10-10)

**Prompt (summarized):** Set up memory architecture and ground-level expectations before coding. Read the assessment PDF, restate the requirements, then: (1) audit/install tooling, (2) design discussion using my mockups, (3) establish development principles.

**Why:** Agree on scope and process before writing code so the build is deliberate and the collaboration is traceable.

**Outcome:**
- Kept: the three-step prework order.
- Changed: AI noted the PDF had not actually been attached and checked the (empty) repo rather than guessing; I re-attached it.
- Added (AI suggestion, accepted): start this log immediately and record manual changes as they happen.

---

## Entry 2 - Requirements analysis of the assessment PDF (2026-10-10)

**Prompt:** "Here is the attached PDF. Please analyze and reiterate your understanding of the requirements!"

**Why:** Confirm a shared understanding of the deliverables and surface ambiguities in the spec before designing anything.

**Outcome:**
- Kept: the summary of backend/frontend/deliverables/expectations, and 8 flagged ambiguities (metric definition, "last month", timezone, null bars, rounding, sort order, error contract, unofficial-API risk).
- Rejected/deferred: nothing; I chose to resolve every ambiguity myself (see Entry 3).

---

## Entry 3 - Resolving spec ambiguities (2026-10-10)

**Prompt (summarized):** My decisions on each ambiguity, and a request that this conversation be captured in the prompt log.

**Why:** The spec leaves several behaviors undefined; as the owner of the solution I define them rather than letting the AI choose silently.

**Decisions made (mine):**
1. `lowAverage` / `highAverage` = mean of the 15-minute bars' `low` / `high` per day.
2. "Last month" = rolling 30 days.
3. Day grouping uses the exchange's local timezone (not UTC).
4. Null bars are parsed out and excluded from averages.
5. Round once at the end, using `double` and **ceiling** (not floor/round) to 4 decimals.
6. Results sorted ascending by day.
7. Errors use RFC 7807 problem details.
8. Upstream provider sits behind an abstraction, with a capped retry count, a timeout, and a fake/mock provider for offline testing.

**AI input:** Flagged that ceiling-rounding with binary doubles can misbehave (e.g. `40.2958 * 10000` may evaluate to `402958.00000000006`, which would ceil to `...59`). To be addressed in design.

---

## Entry 4 - Stack selection and follow-up decisions (2026-10-10)

**Prompt (summarized):** Chose React frontend (table output, each cell rendered individually) and Node/TypeScript backend. Answered the AI's follow-up questions 3-10.

**Why:** Close out remaining ambiguities so design and tooling can proceed.

**Decisions made (mine):**
- Stack: React + Node/TypeScript. Repo has `backend/` and `frontend/`, each with a `setup.md` (to be filled once implemented).
- Round to 4 decimals before ceiling (AI's float-noise mitigation accepted).
- Volume = integer sum of 15m bars per day.
- Include the in-progress day; exclude non-market hours (Yahoo default).
- 30-day window starts at midnight in the exchange timezone.
- Canned-data provider is used automatically as a fallback when Yahoo returns no data (no env toggle).
- 2-minute cache.

**AI input:** Proposed the cache, the repo layout and the mock provider; I accepted them with the modifications above.

---

## Entry 5 - Tooling audit and clarifications (2026-10-10)

**Prompt (summarized):** Corrected my rounding wording and clarified the fallback behavior.

**Why:** The AI flagged (a) my "round to 4 then ceiling" was a no-op and (b) silent canned-data fallback could mislead users. I wanted to correct the first and clarify my intent on the second.

**Outcome:**
- Rounding (corrected, mine): round to 8 decimals, then ceiling at 4 decimals.
- Rejected AI's reading of the fallback: canned data is for the **unit test suite only** (use the real API where possible, canned data when it is unavailable). It is not a runtime fallback, so this supersedes the Entry 4 fallback decision and the AI's suggested "sample data" banner / X-Data-Source header.
- Runtime behavior (mine): serve cached data for 2 minutes; if the TTL has elapsed and Yahoo still fails, the frontend shows the warning banner "Error: Symbol API currently unreachable" and keeps the cached data on screen.
- Tooling audit: Node v24.13.1 and npm 11.8.0 present; no installs needed. Docker not installed and skipped. Yahoo reachable (HTTP 200). Decided to stay on npm.

---

## Entry 6 - Stale-data scope (2026-10-10)

**Prompt (summarized):** Answered the AI's question on outage behavior: the retained-data scenario is same session, then outage. On a page refresh during an outage, fill each predetermined cell with skeleton text such as "---".

**Why:** The AI pointed out that the frontend cannot retain data it never received, and proposed the backend serve expired cache entries flagged as stale. I wanted to keep scope smaller.

**Outcome:**
- Rejected: the AI's recommendation of a backend stale-serving cache. The backend cache simply expires at 2 minutes.
- Kept: frontend retains its last good data in-session and shows the "Error: Symbol API currently unreachable" banner.
- Added (mine): after a refresh during an outage, table cells show "---" placeholders. Mockup to follow.
- Open: behavior for a never-fetched symbol while Yahoo is down is presumed to be a 502 problem-details response with the "---" table; to confirm in design.

---

## Entry 7 - Mockup review (2026-10-10)

**Prompt (summarized):** Mockups added under `Mockups for Symbol Search App/` (Desktop and Mobile). Each JSON field renders as its own "cell" component (Day, Volume, Low Average, High Average). After a symbol search, a date picker clamped to the rolling 30-day window selects which day's data populates the cells. Volume, High Avg and Low Avg show an indicator relative to the current day's value: green up arrow if higher, red down arrow if lower, grey circle if within 1%. Asked the AI to analyze the mockups and raise open questions.

**Why:** Turn the visual design into precise component and behavior requirements before planning the implementation.

**Outcome:** AI reviewed all 8 mockups (4 desktop, 4 mobile: before search, results, new-session failure, same-session failure) and raised open questions on indicator baseline, date-picker behavior, refresh/polling, sidebar purpose, invalid-symbol messaging and accessibility. Answers pending.

---

## Entry 8 - Mockup open questions answered (2026-10-10)

**Prompt (summarized):** Answers to the AI's 11 mockup questions.

**Why:** Finalize UI behavior before an implementation plan.

**Decisions made (mine):**
- Latest (in-progress) day shows no indicators; other days compare to it using the 1% grey rule. Mockup numbers are placeholders.
- Date picker defaults to the latest day; dates outside the 30-day window must be disabled.
- One backend call returns all 30 days; date selection is client-side.
- No auto-polling. Re-searching a symbol uses the cache if under 2 minutes old, otherwise re-queries Yahoo and shows data or the warning.
- A single shared warning component for all warnings; separate warnings for invalid symbols and malformed input. Wording decided during implementation.
- "Symbol Tracker" is just the app name. All imagery (arrows, logo) must be colored SVGs.
- Dates shown without times or timezones, reformatted from ISO.
- WAI-ARIA where needed; CSS modules for styling.

**AI input:** Suggested the Intl-based date formatting, accessible text for the color-only indicators, and CSS modules; accepted. My answer to the polling question rejected the AI's assumption that the frontend would poll.

---

## Entry 9 - Date picker and date format (2026-10-10)

**Prompt (summarized):** Rejected the native date input plus "No trading data" fallback. Weekends and market holidays must be disabled in the picker, via an npm dependency. Date format is "Jan 1st, 1999".

**Why:** Disabling invalid trading days is a cleaner UX than showing an empty state after selection.

**Outcome:**
- Rejected: AI's recommendation of the native `<input type="date">` and the "No trading data" message.
- Kept: AI's explanation of the native input's limits, which informed the decision.
- Approach (AI proposal, to confirm in plan): use react-day-picker, disabling every day in the window that is absent from the API response, so holidays need no hard-coded calendar.
- Format: abbreviated month, day with ordinal suffix, year. Intl has no ordinal formatter, so use `Intl.PluralRules` (ordinal) to build the suffix.

---

## Entry 10 - Development tenets (2026-10-10)

**Prompt (summarized):** Three tenets for the codebase: (1) Resilience: cover edge cases, null guards, try/catch/finally, a fallback for every branch. (2) Scalability: performance-aware queries and rendering, components extensible without teardown. (3) Separation of responsibilities: no mega-methods or mega-classes; each block does one thing well. Plus standard SOLID, WET/DRY and common design principles.

**Why:** Set the quality bar and review criteria before any code is written, and make it persistent for future sessions.

**Outcome:**
- Kept: all three tenets, written verbatim in spirit into the root `CLAUDE.md` together with the locked decisions from Entries 3-9.
- Changed (AI): added "never swallow errors silently" so that fallbacks coexist with visible, typed error reporting. Treated "WET" as a typo for DRY and flagged it.
- Pending: user review of CLAUDE.md.

---

## Entry 11 - Formal implementation plan (Plan Mode, 2026-10-10)

**Prompt (summarized):** Switched the model to Opus 5.5 for quality and asked for a formal plan using Plan Mode.

**Why:** Agree on the architecture, file layout and build order before any code exists, so every step is reviewable against an approved plan.

**Outcome:**
- AI first probed the live Yahoo API (read-only) instead of trusting the spec's curl, and found that **the default range for `interval=15m` is 1 day**. The spec's command alone never returns a month. The plan therefore sends explicit `period1`/`period2`. It also confirmed a 404 plus `chart.error` for unknown symbols, and a 429 without a User-Agent.
- Stack choices asked of me, all accepting the AI recommendation: Fastify, Zod for upstream validation, ESLint + Prettier, and an npm-workspaces root.
- Plan approved as written: layered backend (domain / provider / infra / service / HTTP), frontend state machine plus session cache, a 10-step build order, and a verification checklist.

---

## Entry 12 - Build steps 1-2: scaffolding and backend domain (2026-10-10)

**Prompt:** Plan approval ("start coding").

**Why:** Implement the first two plan steps and stop for review.

**Outcome:**
- Scaffolding: workspaces root, strict TypeScript, ESLint (`strictTypeChecked`) + Prettier, and Vitest.
- **Version decision:** TypeScript 7 is current, but `typescript-eslint` only supports `<6.1`, so TypeScript is pinned to `~6.0.3`. Vitest 5 requires Node `>=22.12`, which set `engines`.
- Domain logic as small pure modules: `ceilToPrecision`, `statistics`, `exchangeDay`, `calendarDay`, `tradingWindow`, `filterValidBars`, `groupBarsByDay`, `summarizeDay` and `buildDailySummaries`. 63 unit tests.
- **AI error caught by the tests:** the AI had repeatedly claimed `40.2958 * 10000 === 402958.00000000006`. The first test run proved that product is exact. The AI searched for genuine cases instead (`40.0001 * 1e4 === 400001.00000000006` and `(0.1 + 0.2) * 1e4 === 3000.0000000000005`) and corrected the tests, the code comment and CLAUDE.md. The rounding design was right; only the example was wrong. This shows why claims about float behavior need to be checked against a test.
- A second failing test had the wrong expectation (a 9th-decimal remainder is below the agreed 8-decimal noise floor, so it is correctly dropped). The test was fixed, not the code.
- Validity rule added beyond the spec: a bar must also satisfy `low <= high`, and volume must be a non-negative integer, otherwise it is dropped (resilience tenet).
- Root `*.md` files are excluded from Prettier so authored docs keep their formatting.

---

## Entry 13 - Method comment convention (2026-10-10)

**Prompt (summarized):** Update memory so that every method uses a multi-line doc comment with a contributor tag: `/** Rocko Bishop / summary and why / @params / @returns */`.

**Why:** Consistent, attributable documentation on every method.

**Outcome:**
- Saved as a standing rule in AI memory and in the `CLAUDE.md` Conventions.
- Retrofitted all 26 existing functions in `backend/src/domain` (exported and private helpers). Tests, typecheck, lint and format still pass.
- AI interpretations, flagged for confirmation: test files are exempt; types and interfaces keep plain JSDoc because they are not methods; the standard ` * ` line prefix is used (the sample omitted it); `@param` is written in TSDoc `name - description` form.

---

## Entry 14 - Build step 3: Yahoo provider (2026-10-10)

**Prompt:** "Alright, this has been committed. Let's begin Step 3."

**Why:** Implement the upstream integration (validation, timeout, capped retries) and the live-or-canned test strategy agreed in Entry 5.

**Outcome:**
- Fixtures: a real TSLA capture (606 bars) and a real not-found response, plus hand-written null-bar and empty-range fixtures, because the real capture contained no nulls.
- **AI found a further undocumented edge case by probing:** for a range with no trades, Yahoo omits `timestamp` entirely and returns `quote: [{}]`. The Zod schema makes those fields optional, so a quiet weekend is not mistaken for a malformed response.
- Layers:
  - `fetchWithRetry` / `retryPolicy`: vendor-neutral, per-attempt `AbortSignal.timeout`, full-jitter exponential backoff, and `Retry-After` honoured but capped. Only network errors, timeouts, 408, 429 and 5xx are retried.
  - `YahooChartProvider`, `yahooRequestBuilder`, `yahooResponseSchema` and `yahooResponseMapper`: Yahoo specifics only, behind the `MarketDataProvider` interface.
  - Typed `AppError` subclasses (400/404/502/503), created now because the provider must throw them.
- AI self-correction during implementation: the first draft treated any 404 as "symbol not found". It was changed to require Yahoo's `chart.error` body, so a misconfigured base URL surfaces as a 502 rather than misleading users.
- Contract test: live when Yahoo is reachable, canned fixture **only** when it is unreachable. Schema drift from a reachable Yahoo still fails the test, which is the point of a contract test. `CONTRACT_YAHOO_BASE_URL=http://127.0.0.1:9` forces the fallback. Both paths were verified.
- 120 tests passing. Typecheck, lint (2 errors found and fixed) and format are clean.

---

## Entry 15 - Build step 4: cache, request coalescing and service (2026-10-10)

**Prompt:** "Now we're ready for Step 4: Caching, duplicate-request guards, and the service."

**Why:** Implement the agreed 2-minute cache and protect Yahoo from bursts of identical requests, behind one orchestrating use-case class.

**Outcome:**
- `Cache<K,V>` is an **async** interface, even though the first implementation is in-memory, so a Redis-backed cache can replace it for multi-instance scaling without touching the service.
- `InMemoryTtlCache`: 2-minute TTL with no stale serving. An entry exactly 2:00 old is expired, matching "2+ minutes re-queries". **Bounded size** with oldest-first eviction, so memory stays flat as more symbols are searched. Injectable clock.
- `InFlightDeduper`: concurrent cold requests for one symbol share a single Yahoo call. Failures are shared with the waiters, but never replayed afterwards.
- `DailySummaryService`: orchestration only. It treats the cache as best-effort (read or write failures are logged and the request still succeeds), caches only successes, and deep-freezes results so a shared cached instance cannot be mutated by one caller.
- Plan deviation (AI proposal): symbol normalization and validation moved from the HTTP layer to `domain/symbol.ts`, and the service applies it. Every entry point then shares one cache key per symbol (`tsla` = ` TSLA `).
- **Real bug caught by a test:** in the first draft of `InFlightDeduper`, a task that threw *synchronously* triggered `finally` before the promise was registered. That would have left a permanently rejected entry, so every later request for that symbol would fail forever. Fixed by starting the task on the next microtask; the test now guards against regression.
- 169 tests passing (49 new). Lint errors about unbound mock methods were fixed by typing the test doubles with properties.

---

## Entry 16 - Build step 5: Fastify app, endpoint, problem details, config (2026-10-10)

**Prompt:** "Step 4 has been committed. I reverted the blank line edit I made since I don't want to make Prettier upset. Let's move onto Step 5!"

**Why:** Expose the use case over HTTP with the agreed RFC 7807 errors, make every tunable configurable, and verify against live Yahoo.

**Outcome:**
- `config/appConfig.ts`: Zod-validated env vars, all with defaults. Fails fast, listing **every** bad variable at once. Deep-frozen.
- `http/`: the route only delegates to a `DailySummaryReader` interface. A response schema gives Fastify a precompiled serializer (faster than `JSON.stringify`) and strips any non-contract field. A global error handler maps AppErrors to problem+json, reports framework 4xx as-is, and hides unexpected errors behind a generic 500 (verified with a "leaked password" test). A 404 handler covers unknown routes.
- Composition split: `app.ts` (HTTP wiring, no listen), `container.ts` (the only place that knows concrete classes), `server.ts` (listen, graceful SIGINT/SIGTERM shutdown with a forced-exit timer, non-zero exit on startup failure).
- `/health` deliberately doesn't call Yahoo, so an upstream outage can't get healthy instances restarted.
- Full-stack tests run the real container with only the network and clock stubbed: cache expiry at exactly 2:00, 5 concurrent cold requests producing 1 Yahoo call, a 503 after 3 attempts that is not cached, and recovery.
- **AI assumption corrected by a test:** the AI expected `/stocks//daily-summary` to 404, but Fastify matches it with an empty symbol. The real stack already returns a 400 "invalid symbol" (more helpful), so the test was moved to the full-stack suite and asserts that.
- **Live verification** (built server against real Yahoo):
  - TSLA: 22 trading days, 2026-09-10 to 2026-10-09, in 0.40 s cold and 0.001 s cached.
  - `^GSPC` works.
  - Unknown symbol gives a 404, malformed gives a 400, and an unknown route gives a 404 problem.
  - SIGINT exits with code 0; `PORT=abc` exits with code 1 and a readable message.
- `backend/setup.md` written: prerequisites, run, test, an endpoint table and an env var reference.
- 203 tests passing (34 new). Typecheck, lint, format and build are clean.

---

## Entry 17 - Build step 6: frontend scaffold (2026-10-10)

**Prompt:** "Alright, let's begin the front-end scaffolding. Initiate Step 6 per the plan!"

**Why:** Stand up the React workspace, design system and page frame that the data-driven components (steps 7-9) will slot into.

**Outcome:**
- Versions checked before install (Vite 8, React 19, plugin-react 6, whose extra peers are optional, and Vitest 5, which supports Vite 8). No conflicts; 0 vulnerabilities.
- Root `npm run dev` now starts the API and the UI together through `concurrently`. The Vite dev proxy forwards `/api`, so development needs no CORS. Verified: AAPL data was served through `localhost:5173/api/...`, and one Ctrl+C stops both servers and frees both ports.
- `styles/tokens.css`: all colors, spacing, type and shape as CSS variables, with a dark theme via `prefers-color-scheme`. The global CSS adds focus rings, a `.visually-hidden` helper and reduced-motion support.
- Icons: a single `SvgIcon` base owns the accessibility rule (labelled means `role="img"`, otherwise `aria-hidden`). Arrow up and down, neutral dot, warning, search and the logo mark are all colored SVGs driven by tokens, plus an SVG favicon.
- `AppShell`: one CSS grid with named areas implements both mockup layouts (desktop sidebar, mobile header row) without rendering anything twice. Banner, sidebar and main landmarks, a single `h1`, and a skip link to a focusable `main`.
- **AI self-corrections during the step:**
  1. The first draft of the icons repeated class-joining logic in every icon. It was extracted to `utils/joinClassNames` for DRY.
  2. `WarningIcon` hard-coded hex colors, against the "tokens only" rule. A `--color-warning-glyph` token was added.
  3. Tests caught that multi-word CSS-module classes vanished under Vitest, because `test.css.modules` overrides Vite's `localsConvention`. Fixed by writing camelCase class names directly, so dev, build and test behave identically.
  4. While smoke-testing, the AI's cleanup command reported the servers stopped when they were still running (a `setsid` PID mix-up). It re-checked the ports, found them still bound, and stopped them correctly.
- Tests live in `frontend/test/`, mirroring the backend's layout. 26 frontend tests plus 203 backend tests pass. Typecheck, lint, format and the production build (69 KB gzipped JS) are clean.

---

## Entry 18 - Build step 7: API client, search state machine, session cache, hook (2026-10-10)

**Prompt:** "Step 6 has been committed -- time to begin Step 7."

**Why:** Implement the frontend data layer: talking to the API, classifying failures, the 2-minute re-search rule, and keeping data on screen during outages.

**Outcome:**
- `api/`: `DailySummaryClient` interface with an HTTP implementation. Zod validates the success body. The caller's abort and the client's own timeout are combined with `AbortSignal.any`. Failures are classified into `invalidInput` (400), `notFound` (404 **with** the symbol-not-found problem type; a bare 404 is `unknown`, mirroring the backend's guard), `unreachable` (network, timeout, 502-504) and `unknown`. A caller abort propagates as an AbortError so it is ignored, never shown.
- `state/`: a pure reducer state machine (`idle`, `loading`, `success`, `error`) with request ids, so late responses from superseded searches are dropped. `SessionCache` keeps entries **after** they go stale (stale data is what gets retained under the warning; freshness only decides whether to hit the network) and is size-bounded.
- `useSymbolSearch`: validates input client-side, serves a re-search under 2 minutes with no request, cancels superseded requests and aborts on unmount.
- `content/warningMessages.ts`: all user-facing copy in one place, including the exact agreed text "Error: Symbol API currently unreachable".
- `config.ts`: the request timeout is 25 s, deliberately longer than the backend's worst case (3 upstream attempts x 5 s plus backoff, about 19 s), so the backend can return its own 503 rather than the browser giving up first.
- **Behavior decisions made by the AI, flagged for confirmation:**
  1. Retained data applies to the **same symbol only**. Searching NVDA during an outage shows "---" plus the banner, never TSLA's numbers.
  2. Both `unreachable` and `unknown` failures retain data ("API not serving proper data"); `notFound` and invalid input do not.
  3. Invalid input clears the cells to "---", because there is no valid symbol for the data to belong to.
  4. Draft wording for the non-outage warnings (empty, malformed, not found, unknown), since the exact text was deferred to implementation.
- AI self-corrections: moved a class field declaration above the constructor, and dropped Zod 4's deprecated `.finite()`.
- 104 frontend tests (78 new) plus 203 backend tests pass. Typecheck, lint, format and build are clean.

---

## Entry 19 - Approving step 7 behavior and finalizing warning copy (2026-10-10)

**Prompt (summarized):** Approved the AI's decisions 1-3 (same-symbol retention only; retain on unreachable or unknown but not on not-found or invalid input; invalid input clears the cells). Replaced the AI's draft copy with my own wording for the empty, malformed, not-found and other-error warnings.

**Why:** User-facing copy and behavior are product decisions I own.

**Outcome:**
- Kept: decisions 1-3 unchanged.
- Changed: all four messages now use my wording. The tests assert each string exactly, so any future copy drift fails the suite.
- AI edits to my wording, flagged for my review: corrected the typo "wen't" to "went"; "[input string]" is filled with the normalized symbol (` zzzz ` reads as `ZZZZ`) because that is what was actually searched.

---

## Entry 20 - Build step 8: search form, cells, indicators, picker, warning banner (2026-10-10)

**Prompt:** "Step 7 has been committed. Let's begin Step 8 and tie it all together!"

**Why:** Turn the data layer into the UI from the mockups.

**Outcome:**
- Two UX gaps in the mockups were put to me as questions instead of being assumed:
  - Picker style: I chose a **popover** (compact trigger showing the date, calendar dropdown) over an always-visible calendar.
  - Valid symbol with zero trading days: I chose a **new warning**, "No trading data found for X in the last 30 days."
- AI checked react-day-picker 10's API in its type definitions before coding against it.
- Domain helpers:
  - `computeTrend`: exactly +/-1% counts as neutral; zero-baseline and non-finite guards.
  - `formatDay`: `Oct 9th, 2026`, with ordinals from `Intl.PluralRules`, including 11th-13th.
  - `formatNumber`: prices always show 4 decimals; volume grouped.
  - `dayKey`: local-midnight conversion, so the picker never shifts a day west of UTC.
- Components:
  - `MetricCell` (a `dt`/`dd` pair; "---" is announced as "No data") and four thin field cells (`DayCell`, `VolumeCell`, `LowAverageCell`, `HighAverageCell`).
  - `MetricGrid`: indicators only for days other than the latest.
  - `TrendIndicator`: shape plus color, with an accessible label and tooltip such as "Higher than Oct 9th, 2026".
  - `WarningBanner`: the one shared template, `role="alert"`.
  - `SymbolSearchForm`: a `role="search"` landmark with a labelled input.
  - `TradingDayPicker` with `usePopover`: Escape or an outside click closes it, focus returns to the trigger, and only days present in the data are enabled (weekends, holidays and out-of-window days are disabled, with navigation clamped to the window).
- `selectDisplay` maps state to the screen in one tested place. `useSelectedDay` resets to the latest day on every new search, per the spec.
- **Issues caught and fixed during the step:**
  1. The React Compiler lint rules flagged ref reads through the popover object (fixed by destructuring), a manual memo they could not verify (removed, since mapping 31 days is trivial), and a non-component export that broke fast refresh (`describeTrend` moved to `content/`).
  2. `FormEvent` is deprecated in `@types/react` 19.3; replaced by `SubmitEvent`.
  3. **A real accessibility bug caught by a test:** the picker trigger's accessible name collapsed to "Trading day:Oct 9th", because a trailing space inside the visually hidden span was trimmed. Fixed with an explicit space node.
  4. The AI assumed disabled month navigation used `disabled`; a probe showed react-day-picker uses `aria-disabled`, which is valid and keeps the buttons discoverable. The test was corrected, not the component.
- App flows are tested end to end against the mockups: before search, results, an earlier day with indicators, reset on a new search, the cache hit at 1:59, the same-session outage keeping data, the new-session outage with placeholders, local rejection of empty or malformed input, not found, no data, and a warning clearing on success.
- 185 frontend tests (80 new) plus 203 backend tests pass. Typecheck, lint, format and both builds are clean. The JS bundle is 117 KB gzipped (react-day-picker brings date-fns).

---

## Entry 21 - Visual QA feedback on step 8 (2026-10-10)

**Prompt (summarized):** I ran the app and shared 5 screenshots (mobile not-found, desktop malformed input, desktop picker open, desktop earlier day with indicators, and the logo close-up). Issues: (1) the calendar popover is cut off on mobile; (2) the logo's line trends down before the arrowhead and should trend up into the arrowhead's center; (3) I want a visual-flair pass later, once implementation is complete. Functionality otherwise worked as expected.

**Why:** The AI had no browser to check rendering, so I did the visual QA. Tests verify structure and behavior, not pixels.

**Outcome:**
- (1) AI root cause: on mobile, the search field grows and wraps the date trigger onto its own row at the left, while the CSS anchored the popover to the trigger's right edge, so it overflowed off-screen. **First fix (rejected by me in QA):** a viewport-fixed, centered bottom sheet. It was fully visible, but it opened far from its trigger and covered the cells. **Revised fix:** the AI made the layout deterministic instead (on mobile the search form always fills the first row, so the date trigger always starts the next row at the left edge) and anchored the calendar directly under the trigger, left-aligned, with a viewport width cap as a safety net and smaller day cells (about 278px wide, inside the 288px available on a 320px phone). Lesson: fix the root cause (unpredictable wrapping) rather than routing around it.
- (2) The last segment ran from (22,9) down to (27,12) and missed the arrowhead. **Fix:** the line now climbs at 45 degrees and ends exactly on the arrowhead corner (28,6). The favicon was fixed the same way. The AI rasterized both SVGs with ImageMagick and inspected them before reporting.
- **Extra bug found by the AI in my screenshots:** the calendar's selected-day ring and nav arrows were the library's default dark blue, low contrast on the dark theme. The token overrides were set on the panel, but react-day-picker declares its variables on `.rdp-root`, so its defaults won. **Fix:** overrides now target `.panel :global(.rdp-root)`; the higher specificity wins regardless of CSS load order (confirmed in the built CSS).
- (3) Recorded as a pending styling pass. The AI will keep steps 9-10 to bugs and layout fixes, and raise the styling work after step 10.

---

## Entry 22 - Second visual QA round: rejecting the first mobile calendar fix (2026-10-10)

**Prompt (summarized):** "Wait, apologies. Not quite. The calendar is visible now on mobile but it looks like the popout was justified to the bottom center." I attached a screenshot of the bottom sheet covering the lower cells, far from its date button. After the revision I attached a second screenshot: "Perfect, it looks exactly as expected."

**Why:** I check every UI change in a real browser before committing. The AI cannot render the app, and passing tests do not mean the layout is right. I caught this after the AI had already drafted the step 8 commit message, and held the commit until it was fixed.

**Outcome:**
- **Rejected:** the AI's first fix for the clipped calendar (a viewport-fixed bottom sheet). It was fully visible, but disconnected from its trigger and it covered content.
- **Accepted after re-review:** the AI addressed the root cause instead. On mobile the search form always fills the first row, so the date trigger always starts the next row at the left edge and the calendar can be anchored directly under it (left-aligned, width-capped). Confirmed by my second screenshot.
- The AI updated Entry 21 and the step 8 commit message to describe the final fix rather than the rejected one.
- Takeaway for the process: I keep doing visual QA myself (the AI offered to install headless Chromium for screenshots, and I declined), and no UI step is committed until I have seen it render correctly on desktop and mobile.

---

## Entry 23 - Build step 9: scroll-to-top, responsive review, accessibility pass (2026-10-10)

**Prompt:** "Perfect, these have been committed. Please proceed with Step 9!"

**Why:** Finish the mobile mockup (back-to-top control) and harden accessibility and responsiveness before the docs step.

**Outcome:**
- `ScrollToTopButton` + `ScrollTopIcon` (colored SVG, as in the mobile mockups): mobile-only, appears after scrolling about 240px, scrolls smoothly (or jumps under reduced motion), then moves focus to `main` so keyboard and screen-reader users land at the top too. `useScrolledPast` uses a passive scroll listener coalesced to one check per animation frame.
- **Interpretation flagged for my review:** the mockups draw the button permanently; the AI shows it only once the page is scrolled, because at the top it would do nothing.
- Accessibility fixes found by the AI's audit of its own step 8 code:
  1. An empty `<aside>` gave screen readers a pointless "Sidebar" landmark; it now renders only when it has content.
  2. Input warnings (empty, malformed, not found) now set `aria-invalid` on the field and link it to the banner via `aria-describedby`, plus a warning-colored border, so the error is not signalled by the banner alone. Outages do not blame the input.
  3. The date popover now also closes when focus leaves it (e.g. Tab past the last day).
  4. The tab title follows the viewed symbol ("TSLA · Symbol Tracker").
- Responsive fix: mobile `main` gets bottom padding, so the fixed back-to-top button can never permanently cover the last card.
- **AI self-correction:** a test exposed that the scroll hook's frame coalescing (`frame ??= requestAnimationFrame(...)`) silently stopped working if the scheduler ran the callback synchronously. Not reachable in real browsers, but fragile, so it was rewritten with an explicit `pending` flag that is correct under any scheduler.
- `APP_NAME` moved from the `Logo` component into `content/documentTitle.ts`, so content never depends on a component.
- 204 frontend tests (19 new) plus 203 backend tests pass. Typecheck, lint, format and build are clean.
- **Pending my visual QA:** the back-to-top button and the invalid-input border on mobile.

---

## Entry 24 - Step 9 visual and keyboard QA (2026-10-10)

**Prompt (summarized):** Two mobile screenshots: the yellow invalid-input border (search "ASDRF", not found) and the back-to-top button after scrolling, with High Average clear of it. Both work as expected. Then a keyboard finding: "Once [the calendar] is open with Enter/Return you cannot `tab` through the dates. Tabbing completely moves on to the next component. You must use the arrow keys to navigate the day cells. Is this expected behavior?"

**Why:** I test with the keyboard as well as visually, not just with a mouse.

**Outcome:**
- Approved: invalid-input border; back-to-top button position, visibility and bottom clearance.
- AI explanation: arrow-key navigation inside the day grid (Tab treats the grid as one stop) is the WAI-ARIA Authoring Practices date-picker pattern, which react-day-picker implements deliberately. The abrupt feel comes from our setup: with a one-month window both month arrows are disabled and skipped by Tab, and the step 9 focus-out rule closes the popover on the first Tab.
- Decision on how much to add on top of the standard pattern: see Entry 25.

---

## Entry 25 - Calendar keyboard decision, and a second focus bug I found (2026-10-10)

**Prompt (summarized):** Asked to choose between (1) a keyboard hint plus keeping Tab inside the open calendar, (2) a hint only, or (3) no change, I picked option 1 and added: "Tabbing out brings focus to other components like the URL bar in my browser, but it doesn't actually close the Calendar. Let's revisit this and ensure that if the Calendar no longer has focus then it closes out."

**Why:** Keyboard users need a discoverable way to operate the calendar, and a popover that stays open after losing focus is a bug.

**Outcome:**
- **Bug I found in the AI's step 9 fix:** the AI's "close when focus moves outside" listened for `focusin` inside the page. Focus moving to the browser's own UI (URL bar, another window) leaves the page and fires no `focusin` there, so the calendar stayed open. **Fix:** the popover also closes on the window's `blur` event. It now closes on any loss of focus: Escape, an outside click, focus elsewhere in the page, or focus leaving the page.
- Option 1 implemented:
  - A visible hint, "Use arrow keys to choose a day. Esc to close.", linked to the dialog through `aria-describedby` so screen readers announce it on open.
  - A new single-purpose `useFocusTrap` hook keeps Tab and Shift+Tab cycling within the open calendar (month arrow and day grid when both are available; it stays on the grid when that is the only stop). Arrow keys still move between days.
- Picker copy moved into `content/datePickerCopy.ts`.
- 7 new keyboard tests: the hint and its description, arrow-key movement, Tab and Shift+Tab containment for both one- and two-stop calendars, Tab never reaching outside controls, window blur closing the dialog, and tab-stop detection. 211 frontend plus 203 backend tests pass; typecheck, lint, format and build are clean.
- Re-tested and approved by me in the browser (see Entry 26).

---

## Entry 26 - Metric cells and keyboard users (2026-10-10)

**Prompt (summarized):** "The actual cells and their contents are not focusable using Tab. My browser goes straight from the calendar back to the top of the browser... It never focuses on the contents within each table cell." Then, choosing the AI's recommended fix: "Let's go with Option 1 but my question is for blind users, how do they consume the contents of the cells?"

**Why:** I was keyboard-testing every part of the page, not only the controls.

**Outcome:**
- AI explanation (kept): read-only content should not be a Tab stop (WCAG discourages focusable static content, because extra stops slow keyboard users). Screen-reader users read content in browse mode (arrow keys in NVDA, JAWS and Orca; VO+arrows in VoiceOver) and jump by landmark. The cells sit in a named "Daily summary" live region and a description list, so they are announced as "Volume, 3,468,371, ...", with placeholders read as "No data". The AI noted that I can try this on Fedora with Orca (Super+Alt+S).
- **Real gap uncovered by my test:** the trend explanation ("Higher than Oct 9th, 2026") existed only as a hover tooltip plus a screen-reader label. Sighted keyboard users and touch users never saw it.
- Options offered: a visible caption (recommended), focusable cells with a tooltip on focus, or leave as-is. **I chose the visible caption.**
- Implemented: each compared value now shows a caption under it ("Higher than Oct 9th", per the preview I approved, using a new `formatMonthDay`). The glyph became decorative (`aria-hidden`), so screen readers don't read the comparison twice, and the hover tooltip was removed as redundant. `MetricCell` takes the glyph and caption as one `Comparison` object, so an arrow can never appear without its explanation. `formatDay` now reuses `formatMonthDay` (DRY).
- Tests updated to the new contract (visible caption text; glyph hidden from the accessibility tree). 215 frontend plus 203 backend tests pass; typecheck, lint, format and build are clean.
- **Re-checked and approved by me** in the browser ("This looks correct to me"), including the calendar keyboard fixes from Entry 25.

---

## Entry 27 - Build step 10: documentation and final pass (2026-10-10)

**Prompt:** "Alright, it is time to begin Step 10 and wrap this up before we move onto styling!"

**Why:** The brief requires a README that lets a reviewer build and run both apps, plus the prompt log and the manual-change notes.

**Outcome:**
- **Verified before documenting:** the AI cloned the committed repo into a scratch directory and ran `npm ci`, `npm test` (418 passing), `lint`, `typecheck` and `build` from scratch, so the README describes what a reviewer will actually experience.
- Added a root `npm start` to run the production build (API plus Vite preview, which also proxies `/api`), verified end to end with live MSFT data.
- The first `npm start` smoke test collided with a server already on port 3000. The script failed safely (`EADDRINUSE`, with the UI shut down by `--kill-others-on-fail`); the AI reran on spare ports instead of touching the other process, and documented the port override in `backend/setup.md`.
- The AI repeated an earlier mistake (a `pgrep -f` pattern matching its own shell, which left test servers running). It caught this from the exit code, found the processes by exact name, and stopped them by PID.
- **AI self-correction:** its README draft contained an invented example row (a second TSLA day it had never received). It was caught on read-back and replaced with two real MSFT rows captured from the live smoke test.
- Docs written or updated:
  - `README.md`: overview, quick start, command table, API reference with an error table, how each open question in the brief was resolved, architecture, testing, accessibility, AI collaboration, and known limitations.
  - `frontend/setup.md` (new) and `backend/setup.md` (root commands, port conflicts).
  - `CLAUDE.md`: decisions from steps 7-9.
  - This log: the Manual changes section now records my mockups, commit authorship and format, and QA work.
- Reviewed and approved by me ("This looks good to me").

---

## Entry 28 - Styling pass, round 1: palette, cell growth, layout (2026-10-10)

**Prompt (summarized):** With an annotated screenshot (green boxes marking where I wanted the content): (1) a purple/lavender neon "cyberpunk" palette, with each cell having a drop shadow and a thin mint-green/blue glow border; (2) on hover or focus a cell grows 20% and shrinks back afterwards, with enough padding that an enlarged cell never touches another cell or the page edge; (3) left-align the search bar and calendar, and let the four cells fill more of the main area.

**Why:** The functional build was complete; this is the visual polish pass I had deferred until after implementation.

**Outcome:**
- AI flagged that "grow on focus" conflicts with the Entry 26 decision (read-only cells are not Tab stops). It implemented my request and **reversed that decision**: each cell is now a focusable `role="group"`, named by its label and described by its value. Growth triggers on hover or `:focus-visible`, not on a mouse click, so a clicked cell never stays enlarged after the pointer leaves.
- (1) `tokens.css` rewritten: deep indigo/purple surfaces, lavender text and brand, a mint-cyan glow for cell borders, glows and focus rings; neon trend colors; a light lavender variant for light mode; and a faint purple background bloom. The favicon and `theme-color` were recolored. Two leftover raw shadow colors were replaced with tokens.
- (2) Collision-free growth by construction: the metric grid is a CSS size container, and its gaps and padding are in `cqi` units sized from the 20% growth. Desktop gap = 25% of a cell's width (two enlarged neighbors still cannot touch); padding = 15% (an enlarged edge cell never reaches the page edge); 16:9 cells keep the vertical clearance proportional; mobile has its own single-column numbers. The derivation is documented in `MetricGrid.module.css`.
- (3) Removed the 960px centered content column: the toolbar sits left with the main padding, and the grid fills the width (about 700x400px cells on a wide screen, roughly matching my sketch).
- **Real accessibility bug caught by a new test:** the cell's computed description read "2,000,000Higher than Oct 9th", run together because adjacent spans had no whitespace. An earlier test had **asserted the run-together text** and was therefore locking the bug in. Fixed with an explicit space node, and that test was corrected.
- Docs written in step 10 (README, `CLAUDE.md`, `frontend/setup.md`) were corrected to describe focusable cells and the new theme.
- 217 frontend tests (2 new) plus 203 backend tests pass. Typecheck, lint, format and build are clean.
- **Pending my visual QA.**

---

## Entry 29 - Styling QA: desktop must never scroll (2026-10-10)

**Prompt (summarized):** A desktop screenshot showing the cells too tall for the window (the bottom row cut off and a scrollbar), with: "I don't ever want there to be a scrollport when the layout isn't using the mobile version. All 4 cells should always be visible in the main body while using the Desktop format."

**Why:** Visual QA of styling round 1. A dashboard of four values should be fully visible at a glance.

**Outcome:**
- AI root cause: round 1 sized everything from the grid's **width** only (16:9 cells plus width-based spacing), so a wide but short window produced cells taller than the viewport.
- **Fix:** the desktop page is locked to the viewport height (`100dvh`, no page scroll). Below the header and toolbar, the main column gives the grid exactly the remaining space, and the 2x2 cells stretch to fill it instead of keeping a fixed ratio. The grid is now a 2-D size container: horizontal spacing uses `cqi` (its width) and vertical spacing uses `cqb` (its height), with the same 25% gap and 15% padding derivation, so the 20% hover growth stays clear on all four sides at any window shape. Cell text scales with the smaller of width and height, so it fits short windows.
- Mobile is unchanged: a single column of 16:9 cells, with the page scrolling.
- 217 frontend tests pass (CSS layout is not covered by jsdom tests, so this relies on my browser QA). Lint, format and build are clean.
- **Pending my visual QA** at several window sizes.

---

## Entry 30 - Styling QA: larger text inside the cells (2026-10-10)

**Prompt (summarized):** A desktop screenshot confirming the no-scroll fix (all four cells visible, NVDA data). Then: "Could we scale up the text inside of the boxes so that there's less negative space within each cell?"

**Why:** With the cells now filling the screen, the fixed-cap text left large empty areas.

**Outcome:**
- Entry 29's fix is confirmed working by my screenshot.
- AI root cause: the text was sized relative to the whole **grid**, with a hard cap (value at most 3rem), so it stopped growing long before the cells did.
- **Fix:** each cell is now its own CSS size container, and its text is sized from the cell's width and height. The bound was derived from the widest content: a value like "121,941,429 ▲" is about 8em wide, so the value is capped at 9.5% of the cell width (about 15% margin) and 30% of its height (label, value and caption stacked). The label and caption scale in proportion. The trend glyph is sized in `em`, so it grows with the number. Mobile now uses the same rules, so the separate mobile font overrides were removed.
- The AI's estimate for the screenshot's cell size (about 820x430px): value about 48px to 78px, label about 20px to 34px, caption 14px to 28px, with the widest value at about 70% of the cell width.
- 217 frontend tests pass; lint, format and build are clean; no undefined tokens.
- Re-checked and approved by me ("This looks good"). This closes the styling pass.

---

## Manual changes (outside AI)

Work I did myself, outside the AI, and why:

- **UI mockups (`Mockups for Symbol Search App/`):** I drew all 8 mockups (4 desktop, 4 mobile: before search, results, new-session failure, same-session failure) before any UI code existed, so the AI implemented my design rather than inventing one.
- **All git operations and commit messages:** I made every commit myself after reviewing each step. The AI drafted messages on request, but for the first commit I **rewrote its suggested title format** (`feat(backend): ...`) into my own convention, `Feature/<Area>-Implementation: <summary>`, and the AI adopted it for every later draft. Keeping commits manual meant nothing reached the history without my sign-off.
- **Visual and keyboard QA:** I ran the app in my browser after each UI step, testing desktop, mobile width and keyboard-only use, and reported the issues in Entries 21, 22, 24, 25 and 26 with screenshots. I declined the AI's offer to install a headless browser for its own screenshots, so that this review stayed with me.
- **2026-10-10, `backend/src/infra/http/fetchWithRetry.ts`:** I added a blank line inside `HttpGetRequest`. It contained trailing whitespace, which failed Prettier and `.editorconfig`. The AI flagged it before drafting the step 4 commit message, and I reverted it to keep the codebase format-clean. Net change: none.
