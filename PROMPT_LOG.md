# PROMPT_LOG

Log of AI prompts used during this assessment. Each entry: the prompt, why it was sent, and what was kept / changed / rejected.
Manual (non-AI) changes are recorded in the final section.

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

## Manual changes (outside AI)

- **2026-10-10, `backend/src/infra/http/fetchWithRetry.ts`:** I added a blank line inside `HttpGetRequest`. It contained trailing whitespace, which failed Prettier and `.editorconfig`. The AI flagged it before drafting the step 4 commit message, and I reverted it to keep the codebase format-clean. Net change: none.
