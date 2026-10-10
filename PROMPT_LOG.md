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
| 31 | The building session's self-assessment | **Commissioned an independent review** in a fresh session; it found a loading bug the self-assessment missed. I approved its fix order |
| 32-35 | Fixes from the review | **Directed** the scope (loading bug first, then cache, cleanup, tests, docs) |
| 36 | Browser QA of the loading fix; a second review brief | **Confirmed** cells stay populated during a re-search; **commissioned** a rewritten `overview analysis.md` for another fresh-session review |
| 37-38 | Second independent review's findings | **Chose** which to act on (focus token, error details, hygiene); **relaxed my own doc-block convention** to ambiguous methods only; **asked for** a 30-day table with a view toggle; kept the loading-state design open for discussion |
| 39 | Loading-state options and the table's design | **Chose** the delayed spinner and ignoring repeat submits; **drew** desktop and mobile table mockups; **specified** toggle placement, newest-first order, glyphs per row, row-to-day navigation with a back button that restores the row, and panel-only scrolling; **settled** three gaps the AI found between the mockups (picker hidden in Table view, full vs short headers, back-button placement) |
| 40 | Browser QA of the Table view (screenshot) | **Found** right-aligned values misaligning: the latest row's number sat over the next row's glyph; asked for left alignment |
| 41 | Mobile QA of the Table view and back button (2 screenshots) | **Approved** the mobile table and the desktop layout; **asked** for "Back to table" to sit left-aligned under the date button on mobile, for a cohesive layout |
| 42 | Final look and behavior of the Table view; a third review brief | **Confirmed** desktop and mobile behave as expected; **commissioned** a code sweep focused on the table and a rewritten `overview analysis.md` for another fresh-session review |
| 43-44 | Third independent review (scope, readability, architecture) | **Approved** the table copy; **reversed my own busy-guard rule** so a new symbol can replace a running search; **chose** to move all inline copy into `content/`, make the trend comparison plain data, trim duplicated tests and drop `@param`/`@returns` lines that restate types |
| 45 | Browser QA of the new search behavior | **Found a bug**: Table view fell back to the Day view while a new symbol loaded |
| 46 | Behavior while data is missing | **Specified** that everything but the values stays visible; **answered** the AI's four questions (generic note wording, an unavailable "---" picker, scope after the first data, a shimmer while loading) |
| 47 | Final look and behavior; a fourth review brief | **Confirmed** everything looks and behaves as expected; **commissioned** a self-sweep and a rewritten `overview analysis.md` for another fresh-session review |
| 48 | Fourth independent review | Fourth unbiased code review. I felt like this was the last one, so I encouraged Claude to be thorough so we could wrap up this project. |
| 49 | Fourth review's findings | Based on Claude's findings I chose to fix some documentation suggestions and move MetricField but skipped the other two suggestions due to the project's maturity. |
| 50 | Remaining minor findings | Limited other minor changes to basically only stuff that was zero-risk. |

---

## Entry 1 - Project kickoff and prework plan (2026-10-10)

**Prompt (summarized):** Set up memory architecture and ground-level expectations before coding. Read the assessment PDF, restate the requirements, then: (1) audit/install tooling, (2) design discussion using my mockups, (3) establish development principles.

**Why:** Groundwork is important before beginning implementation and I wanted the AI and me to have a shared understanding of the project.

**Outcome:**
- Kept: the three-step prework order.
- Changed: AI noted the PDF had not actually been attached and checked the (empty) repo rather than guessing; I re-attached it.
- Added (AI suggestion, accepted): start this log immediately and record manual changes as they happen.

---

## Entry 2 - Requirements analysis of the assessment PDF (2026-10-10)

**Prompt:** "Here is the attached PDF. Please analyze and reiterate your understanding of the requirements!"

**Why:** The AI told me what it believed the project was asking so I could confirm or deny the expected outcomes.

**Outcome:**
- Kept: the summary of backend/frontend/deliverables/expectations, and 8 flagged ambiguities (metric definition, "last month", timezone, null bars, rounding, sort order, error contract, unofficial-API risk).
- Rejected/deferred: nothing; I chose to resolve every ambiguity myself (see Entry 3).

---

## Entry 3 - Resolving spec ambiguities (2026-10-10)

**Prompt (summarized):** My decisions on each ambiguity, and a request that this conversation be captured in the prompt log.

**Why:** It was important that I track my involvement in the outcomes. I was a part of every decision and greenlit or rejected all design decisions for the duration of the project.

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

**Why:** Close out remaining ambiguities so that Claude could formally begin the design and planning phase.

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

**Why:** The AI flagged a couple of ambiguous instructions from me. I clarified the intent so that the implementation plan could be as robust and thorough as possible.

**Outcome:**
- Rounding (corrected, mine): round to 8 decimals, then ceiling at 4 decimals.
- Rejected AI's reading of the fallback: canned data is for the **unit test suite only** (use the real API where possible, canned data when it is unavailable). It is not a runtime fallback, so this supersedes the Entry 4 fallback decision and the AI's suggested "sample data" banner / X-Data-Source header.
- Runtime behavior (mine): serve cached data for 2 minutes; if the TTL has elapsed and Yahoo still fails, the frontend shows the warning banner "Error: Symbol API currently unreachable" and keeps the cached data on screen.
- Tooling audit: Node v24.13.1 and npm 11.8.0 present; no installs needed. Docker not installed and skipped. Yahoo reachable (HTTP 200). Decided to stay on npm.

---

## Entry 6 - Stale-data scope (2026-10-10)

**Prompt (summarized):** Answered the AI's question on outage behavior: the retained-data scenario is same session, then outage. On a page refresh during an outage, fill each predetermined cell with skeleton text such as "---".

**Why:** I reined in scope compared to Claude's proposal and gave it an alternative solution.

**Outcome:**
- Rejected: the AI's recommendation of a backend stale-serving cache. The backend cache simply expires at 2 minutes.
- Kept: frontend retains its last good data in-session and shows the "Error: Symbol API currently unreachable" banner.
- Added (mine): after a refresh during an outage, table cells show "---" placeholders. Mockup to follow.
- Open: behavior for a never-fetched symbol while Yahoo is down is presumed to be a 502 problem-details response with the "---" table; to confirm in design.

---

## Entry 7 - Mockup review (2026-10-10)

**Prompt (summarized):** Mockups added under `Mockups for Symbol Search App/` (Desktop and Mobile). Each JSON field renders as its own "cell" component (Day, Volume, Low Average, High Average). After a symbol search, a date picker clamped to the rolling 30-day window selects which day's data populates the cells. Volume, High Avg and Low Avg show an indicator relative to the current day's value: green up arrow if higher, red down arrow if lower, grey circle if within 1%. Asked the AI to analyze the mockups and raise open questions.

**Why:** I wanted to give Claude a formalized design so that it had an idea of how to write up the CSS before actually beginning to write code. More shared understanding is better.

**Outcome:** AI reviewed all 8 mockups (4 desktop, 4 mobile: before search, results, new-session failure, same-session failure) and raised open questions on indicator baseline, date-picker behavior, refresh/polling, sidebar purpose, invalid-symbol messaging and accessibility. Answers pending.

---

## Entry 8 - Mockup open questions answered (2026-10-10)

**Prompt (summarized):** Answers to the AI's 11 mockup questions.

**Why:** Clear up any ambiguity with the mockup designs and fill any gaps so that Claude could generate a more comprehensive solution.

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

**Why:** Establish my own expectations for code quality and review criteria before any code is written, and make it persistent for future sessions.

**Outcome:**
- Kept: all three tenets, written verbatim in spirit into the root `CLAUDE.md` together with the locked decisions from Entries 3-9.
- Changed (AI): added "never swallow errors silently" so that fallbacks coexist with visible, typed error reporting. Treated "WET" as a typo for DRY and flagged it.
- Pending: user review of CLAUDE.md.

---

## Entry 11 - Formal implementation plan (Plan Mode, 2026-10-10)

**Prompt (summarized):** Switched the model to Opus 5.5 for quality and asked for a formal plan using Plan Mode.

**Why:** I wanted the best quality output from Claude. I also asked for the formal plan including file layout and build order before any code exists, so every step is reviewable against that plan.

**Outcome:**
- AI first probed the live Yahoo API (read-only) instead of trusting the spec's curl, and found that **the default range for `interval=15m` is 1 day**. The spec's command alone never returns a month. The plan therefore sends explicit `period1`/`period2`. It also confirmed a 404 plus `chart.error` for unknown symbols, and a 429 without a User-Agent.
- Stack choices asked of me, all accepting the AI recommendation: Fastify, Zod for upstream validation, ESLint + Prettier, and an npm-workspaces root.
- Plan approved as written: layered backend (domain / provider / infra / service / HTTP), frontend state machine plus session cache, a 10-step build order, and a verification checklist.

---

## Entry 12 - Build steps 1-2: scaffolding and backend domain (2026-10-10)

**Prompt:** Plan approval ("start coding").

**Why:** Finally, it was time to begin the actual implementation.

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

**Why:** I wanted to have thorough documentation on every method so that there wouldn't be any questions as to the whats or whys.

**Outcome:**
- Saved as a standing rule in AI memory and in the `CLAUDE.md` Conventions.
- Retrofitted all 26 existing functions in `backend/src/domain` (exported and private helpers). Tests, typecheck, lint and format still pass.
- AI interpretations, flagged for confirmation: test files are exempt; types and interfaces keep plain JSDoc because they are not methods; the standard ` * ` line prefix is used (the sample omitted it); `@param` is written in TSDoc `name - description` form.

---

## Entry 14 - Build step 3: Yahoo provider (2026-10-10)

**Prompt:** "Alright, this has been committed. Let's begin Step 3."

**Why:** Directed Claude to implement the upstream integration (validation, timeout, capped retries) and the canned data fallback test strategy agreed earlier in the session.

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

**Why:** Directed Claude to implement the agreed 2-minute cache and protect Yahoo from potential DDOS from bursts of identical requests, behind one orchestrating class.

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

**Why:** Architect the HTTP portion with the agreed RFC 7807 errors, make every tunable value configurable, and verify against the actual Yahoo endpoint.

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

**Why:** Directed Claude to set up the React workspace, design system and page frame that the data-driven components in steps 7-9 would shortly slot into.

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

**Why:** Directed Claude to implement the frontend data layer: talking to the API, organizing failures, the 2-minute cache rule, and keeping data on screen during outages.

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

**Why:** User-facing text and behavior are product decisions I own and will continue to own throughout this process.

**Outcome:**
- Kept: decisions 1-3 unchanged.
- Changed: all four messages now use my wording. The tests assert each string exactly, so any future copy drift fails the suite.
- AI edits to my wording, flagged for my review: corrected the typo "wen't" to "went"; "[input string]" is filled with the normalized symbol (` zzzz ` reads as `ZZZZ`) because that is what was actually searched.

---

## Entry 20 - Build step 8: search form, cells, indicators, picker, warning banner (2026-10-10)

**Prompt:** "Step 7 has been committed. Let's begin Step 8 and tie it all together!"

**Why:** Directed Claude to implement the UI. He wired the data layer into the UI from the mockups.

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

**Why:** The AI had no browser to check rendering, so I did the visual QA; the manual tests verified structure and behavior.

**Outcome:**
- (1) AI root cause: on mobile, the search field grows and wraps the date trigger onto its own row at the left, while the CSS anchored the popover to the trigger's right edge, so it overflowed off-screen. **First fix (rejected by me in QA):** a viewport-fixed, centered bottom sheet. It was fully visible, but it opened far from its trigger and covered the cells. **Revised fix:** the AI made the layout deterministic instead (on mobile the search form always fills the first row, so the date trigger always starts the next row at the left edge) and anchored the calendar directly under the trigger, left-aligned, with a viewport width cap as a safety net and smaller day cells (about 278px wide, inside the 288px available on a 320px phone). Lesson: fix the root cause (unpredictable wrapping) rather than routing around it.
- (2) The last segment ran from (22,9) down to (27,12) and missed the arrowhead. **Fix:** the line now climbs at 45 degrees and ends exactly on the arrowhead corner (28,6). The favicon was fixed the same way. The AI rasterized both SVGs with ImageMagick and inspected them before reporting.
- **Extra bug found by the AI in my screenshots:** the calendar's selected-day ring and nav arrows were the library's default dark blue, low contrast on the dark theme. The token overrides were set on the panel, but react-day-picker declares its variables on `.rdp-root`, so its defaults won. **Fix:** overrides now target `.panel :global(.rdp-root)`; the higher specificity wins regardless of CSS load order (confirmed in the built CSS).
- (3) Recorded as a pending styling pass. The AI will keep steps 9-10 to bugs and layout fixes, and raise the styling work after step 10.

---

## Entry 22 - Second visual QA round: rejecting the first mobile calendar fix (2026-10-10)

**Prompt (summarized):** "Wait, apologies. Not quite. The calendar is visible now on mobile but it looks like the popout was justified to the bottom center." I attached a screenshot of the bottom sheet covering the lower cells, far from its date button. After the revision I attached a second screenshot: "Perfect, it looks exactly as expected."

**Why:** I check every UI change in my actual browser before committing. Claude didn't have the tools to render the app, and passing tests do not mean the layout is right. I caught this after the AI had already drafted the step 8 commit message, and asked him to withhold the commit until it was fixed.

**Outcome:**
- **Rejected:** the AI's first fix for the clipped calendar (a viewport-fixed bottom sheet). It was fully visible, but disconnected from its trigger and it covered content.
- **Accepted after re-review:** the AI addressed the root cause instead. On mobile the search form always fills the first row, so the date trigger always starts the next row at the left edge and the calendar can be anchored directly under it (left-aligned, width-capped). Confirmed by my second screenshot.
- The AI updated Entry 21 and the step 8 commit message to describe the final fix rather than the rejected one.
- Takeaway for the process: I keep doing visual QA myself (the AI offered to install headless Chromium for screenshots, and I declined), and no UI step is committed until I have seen it render correctly on desktop and mobile.

---

## Entry 23 - Build step 9: scroll-to-top, responsive review, accessibility pass (2026-10-10)

**Prompt:** "Perfect, these have been committed. Please proceed with Step 9!"

**Why:** Directed Claude to finish the mobile mockup and harden accessibility and responsiveness before populating the documentation.

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

**Why:** I test with the keyboard as well as visually, not just with a mouse. I had some questions about standards for WAI-ARIA implementation.

**Outcome:**
- Approved: invalid-input border; back-to-top button position, visibility and bottom clearance.
- AI explanation: arrow-key navigation inside the day grid (Tab treats the grid as one stop) is the WAI-ARIA Authoring Practices date-picker pattern, which react-day-picker implements deliberately. The abrupt feel comes from our setup: with a one-month window both month arrows are disabled and skipped by Tab, and the step 9 focus-out rule closes the popover on the first Tab.
- Decision on how much to add on top of the standard pattern: see Entry 25.

---

## Entry 25 - Calendar keyboard decision, and a second focus bug I found (2026-10-10)

**Prompt (summarized):** Asked to choose between (1) a keyboard hint plus keeping Tab inside the open calendar, (2) a hint only, or (3) no change, I picked option 1 and added: "Tabbing out brings focus to other components like the URL bar in my browser, but it doesn't actually close the Calendar. Let's revisit this and ensure that if the Calendar no longer has focus then it closes out."

**Why:** Keyboard users needed a clear way to operate the calendar, and I determined that a pop-up that stays open after losing focus is a bug.

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

**Why:** The brief requires a README that lets a reviewer build and run both apps, plus the prompt log and the manual-change notes. We had the implementation, we just needed to document everything properly.

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

**Why:** The functional build was complete; this is the visual polish pass I had pushed back until after implementation. User Experience is very important to me and I wanted it to look good.

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

**Why:** This was the first round of visual QA I had post-revamp. A dashboard of four values should be fully visible at a glance.

**Outcome:**
- AI root cause: round 1 sized everything from the grid's **width** only (16:9 cells plus width-based spacing), so a wide but short window produced cells taller than the viewport.
- **Fix:** the desktop page is locked to the viewport height (`100dvh`, no page scroll). Below the header and toolbar, the main column gives the grid exactly the remaining space, and the 2x2 cells stretch to fill it instead of keeping a fixed ratio. The grid is now a 2-D size container: horizontal spacing uses `cqi` (its width) and vertical spacing uses `cqb` (its height), with the same 25% gap and 15% padding derivation, so the 20% hover growth stays clear on all four sides at any window shape. Cell text scales with the smaller of width and height, so it fits short windows.
- Mobile is unchanged: a single column of 16:9 cells, with the page scrolling.
- 217 frontend tests pass (CSS layout is not covered by jsdom tests, so this relies on my browser QA). Lint, format and build are clean.
- **Pending my visual QA** at several window sizes.

---

## Entry 30 - Styling QA: larger text inside the cells (2026-10-10)

**Prompt (summarized):** A desktop screenshot confirming the no-scroll fix (all four cells visible, NVDA data). Then: "Could we scale up the text inside of the boxes so that there's less negative space within each cell?"

**Why:** Too much negative space looks bad. With the cells now filling the screen, the fixed-cap text left large empty areas.

**Outcome:**
- Entry 29's fix is confirmed working by my screenshot.
- AI root cause: the text was sized relative to the whole **grid**, with a hard cap (value at most 3rem), so it stopped growing long before the cells did.
- **Fix:** each cell is now its own CSS size container, and its text is sized from the cell's width and height. The bound was derived from the widest content: a value like "121,941,429 ▲" is about 8em wide, so the value is capped at 9.5% of the cell width (about 15% margin) and 30% of its height (label, value and caption stacked). The label and caption scale in proportion. The trend glyph is sized in `em`, so it grows with the number. Mobile now uses the same rules, so the separate mobile font overrides were removed.
- The AI's estimate for the screenshot's cell size (about 820x430px): value about 48px to 78px, label about 20px to 34px, caption 14px to 28px, with the widest value at about 70% of the cell width.
- 217 frontend tests pass; lint, format and build are clean; no undefined tokens.
- Re-checked and approved by me ("This looks good"). This closes the styling pass.

---

## Entry 31 - Independent review in a fresh session (2026-10-10)

**Prompt (summarized):** In a new session, I asked for a thorough analysis of the codebase against the brief and against `overview analysis.md`, the self-assessment written by the session that built most of the code. I asked three questions: (1) is it over-engineered for the scope, and are the tests thorough or bloated; (2) how easy is it for a newcomer to understand, and are the design decisions documented; (3) is the architecture organized, or does it look like AI spaghetti?

**Why:** The building session graded its own work. A fresh context, with none of the build history or context, is a more valuable opinion in my eyes than another review from the original author, and it tests whether the docs alone explain the code.

**Outcome (AI findings, verified by running every check):**
- 420 tests (203 backend, 217 frontend), lint, typecheck and format all clean. The CSS spacing math for the 20% cell growth was checked and holds on desktop and mobile.
- **Architecture:** not spaghetti. Layering is conventional and imports flow one way. Two small leaks: the `DailySummaries` type lives in the service layer, and the domain throws HTTP-flavored errors.
- **New bug the self-assessment missed:** a re-search drops the cells to "---" and hides the date picker for the whole request, so during an outage the "kept" data vanished for up to ~19 s (the backend's retry cycle) before returning under the warning. Every refresh after the cache expired also flashed "---".
- **Over-engineering is specific, not general:** the same values are re-validated at every layer (config is Zod-checked, then re-asserted by the window, cache and session-cache code); `ceilToPrecision` is 75 lines with configurable precision and an unreachable large-value fallback for a one-line spec; unused `AppShell` props; a factory that only hides a class.
- **Tests:** a normal size ratio (about 0.9 test lines per source line), but the same behaviors are re-tested at three layers, and `accessibility.test.tsx` is grouped by build step rather than by unit.
- **Docs:** good for a newcomer. Stale test counts and "styling pass planned" lines in the README and `CLAUDE.md`; the 31-calendar-date window is undocumented; `WINDOW_DAYS` is configurable but the copy says "30 days".
- **Disagreed with the self-assessment** on the window item (it matches my Entry 4 decision, so it needs documenting, not fixing) and sharpened its vague over-engineering item into the list above.
- Kept: all findings. I concurred and approved the suggested order: (1) the loading bug, (2) cache stacking, (3) remove redundant validation and dead props, (4) trim redundant tests, (5) update docs to match. See Entries 32-35.

---

## Entry 32 - Fix: cells stay populated while a symbol reloads (2026-10-10)

**Prompt:** "I concur with your findings. Please add my query and this fresh analysis to the prompts log. To move forward, let's fix the loading state bug and make sure the cells stay populated while loading. After that, let's resolve suggestions 2 - 4 and update suggestion 5 based on the outcomes."

**Why:** Keeping the last good data was the point of the outage design, and the loading state defeated that design.

**Outcome:**
- The loading state now carries `previous`: the symbol's last good data from the session cache. `selectDisplay` shows it, so the cells and the date picker stay up during the request, with `aria-busy` set on the grid.
- **Same symbol only**, per the locked retention rule: while a *different* symbol loads, the cells show "---", because the cells do not name the symbol and showing TSLA's values while AAPL loads would mislead.
- The outage `App` test now checks the in-between state (data and picker still shown while the request is pending), not only the end state. **Verified the test catches the bug:** with the one-line fix reverted, it fails.
- Reducer, selector and hook tests extended for `previous` (including "never another symbol's data while loading").

---

## Entry 33 - Fix: one cache decides freshness (2026-10-10)

**Prompt:** Suggestion 2 from Entry 31 (same prompt as Entry 32).

**Why:** The backend's 2-minute cache and the browser's 2-minute cache stacked, so data could be up to about 4 minutes old. No good, so I removed one of those 2-minute delays.

**Outcome:**
- Chose the option that removes code: the frontend no longer has a TTL. Every search asks the API and the backend's cache alone decides freshness. The session cache now only remembers each symbol's last good data, for Entry 32's loading display and for outage retention.
- Removed: the `isFresh` check, the `servedFromCache` action, the frontend clock dependency, `SymbolData.fetchedAt` and the `cacheTtlMs` setting.
- **Changes a locked decision's wording, not its intent:** `CLAUDE.md` said "re-searching hits the cache if under 2 minutes old". It still does, but the cache is now the backend's. Updated `CLAUDE.md` to say so. A re-search within 2 minutes now costs one fast round trip to the API instead of none.

---

## Entry 34 - Remove redundant validation and dead code (2026-10-10)

**Prompt:** Suggestion 3 from Entry 31.

**Why:** Some values were re-checked at every layer. That adds code and tests without adding safety, and I didn't want you guys to read it as boilerplate ceremony.

**Outcome:**
- **Rule adopted** (now in `CLAUDE.md` conventions): validate at the boundaries only (env config, the HTTP symbol, the Yahoo payload, `filterValidBars`). Kept the guards that protect real math preconditions: `mean` of an empty list, and the safe-integer volume sum.
- Removed the re-assertions in `tradingWindow`, `InMemoryTtlCache`, `SessionCache`, `shiftDayKey` (and `isDayKey`, which only it used), `toExchangeDayKey`, `summarizeDay` and `computeTrend`.
- `ceilToPrecision` reduced from 75 lines to the spec's one-line formula: no configurable precision, no argument checks, no unreachable large-value fallback. The float-noise tests are kept.
- Removed: deep-freezing the config (the `readonly` types already prevent mutation), the unused `AppShell` `headerContent` and `sidebarContent` props, the factory that only hid `HttpDailySummaryClient`, and a false performance claim in a `sum` comment.
- `WINDOW_DAYS` and `FETCH_BUFFER_DAYS` are now constants instead of env vars, so the window can no longer drift from my "in the last 30 days" copy. The copy itself is unchanged.
- The `DailySummaries` type moved from the service to `domain/types`. The input-failure kinds got one named type instead of a repeated union.

---

## Entry 35 - Trim redundant tests and update docs (2026-10-10)

**Prompt:** Suggestions 4 and 5 from Entry 31.

**Why:** The same behaviors were tested at three layers, and the docs had drifted from the code. I asked Claude to trim redundancy and update the docs to accurately reflect the code.

**Outcome:**
- **Tests:** 420 → 372 (203 → 176 backend, 217 → 196 frontend). Most of the drop is tests of removed code (validation, freshness, unused props); the rest is duplicates:
  - the 2-minute re-query is tested by the cache unit and full-stack tests, not again by the service;
  - coalescing is tested by the deduper unit and service tests, not again full-stack;
  - the 400-to-`malformedInput` fold is tested in `toSearchFailure`, not again in the hook;
  - icon accessibility is tested once on `SvgIcon`, and each icon only checks its color.
- `accessibility.test.tsx` was grouped by build step. Its unit tests moved to the suites for the units they test (`toSearchFailure`, `SymbolSearchForm`, the picker keyboard suite), so it now holds only `App`-level accessibility flows. "Step 9" headers were replaced with what each suite covers.
- **Docs:** fixed the README and `CLAUDE.md` test counts and the stale "styling pass planned" lines. Documented the 31-calendar-date window, the single-cache rule, the loading behavior and the window constant. Added a one-paragraph frontend search-flow trace to the README. Added a README line explaining that the `Rocko Bishop` doc-block tag means contributor of record, not hand-written. Updated both `setup.md` files.
- **AI slips, caught before handing over:** running Prettier on whole folders reformatted the two canned Yahoo captures in `backend/test/fixtures` (explicit paths bypass `.prettierignore`); reverted. One scripted test removal cut a test short and left a fragment; the test run caught it and it was fixed.
- All 372 tests pass; typecheck, lint, format and build are clean. Net change: about 280 lines added and 650 removed.
- **Pending my review and visual QA** (the loading behavior is visible in the browser: re-search a symbol and the cells should not blank).

---

## Entry 36 - QA of the fixes, and a second review brief (2026-10-10)

**Prompt:** "Confirmed the symbol behavior works as expected. I would now like for you to perform another comprehensive analysis and update the overview analysis.md file with your findings. I'll pass it along to a new session for another round of unbiased review."

**Why:** The session that made the Entry 32-35 changes is no longer an unbiased reviewer of them. Having it overwrite the written brief lets a fresh session start with the context but without the bias.

**Outcome:**
- **My browser QA confirmed** Entry 32: re-searching a symbol keeps its cells populated while loading.
- AI re-read every source file plus the config, CSS, contract test and test support files, and rewrote `overview analysis.md`:
  - a section asking the next reviewer to scrutinize this session's own changes;
  - findings ranked by severity, each marked Confirmed or Verify.
- New findings:
  - light-mode focus ring contrast is about 2.5:1, below the WCAG 3:1 minimum for non-text;
  - Zod issue dumps and Yahoo error text reach API clients in the problem `detail`;
  - since Entry 33, the outage banner disappears during a reload, and every outage re-search waits for the backend's full retry cycle;
  - the contract test's quarter-hour assertion may fail during market hours (to verify);
  - a timeout during the body read is reported as 502 rather than 503 (to verify);
  - dead `silentLogger`, several unneeded exports and six unused tokens;
  - the doc-block convention is ambiguous for arrow-function handlers.
- No code changed in this entry.

---

## Entry 37 - Second independent review, against the brief and `overview analysis.md` (2026-10-10)

**Prompt:** "I'd like for you to do a thorough analysis of this take home assessment. Multiple other sessions drove most of the changes and their analysis of the code is contained within overview analysis.md at the project root. I'd like for you to analyze the code against the given brief and the analysis doc." It came with three questions: (1) is it over-engineered, and are the tests thorough or bloated; (2) how easy is it for a newcomer, and are decisions documented; (3) is the architecture organized, or does it look like AI spaghetti?

**Why:** The previous session wrote `overview analysis.md` about its own changes. A fresh session checks that brief against the code and the original PDF -- more unbiased review to strengthen the final result.

**Outcome (AI findings, verified by reading every source file and running the checks):**
- 372 tests, lint and typecheck are clean, as the brief doc states. Every dead-code item it lists is confirmed, plus `isValidBar` (exported, used only in its own file). The light-mode focus-ring contrast is confirmed at 2.52:1.
- **New finding:** there is no visible loading state anywhere. `busy` only sets `aria-busy`. During an outage re-search, sighted users see the warning vanish and the old data look current for up to about 19 s.
- **Brief vs design:** the brief asks for a "table, chart, or both". The UI shows one day at a time in cards, from my mockups. The analysis doc says the brief requires individual cells; it does not. That requirement comes from my mockups.
- Stale doc comment: `content/trendLabels.ts` still describes a tooltip and accessible name, and an example with a year.
- `useMemo` in `TradingDayPicker` never hits, because `App` builds a new `availableDays` array on every render (trivial cost).
- Comments are about a third of all source lines, more than the "about a fifth" the doc reports. Trivial helpers carry the most ceremony.
- My decisions are in Entry 38.

## Entry 38 - Acting on the second review: contrast, error details, hygiene, doc-block rule (2026-10-10)

**Prompt:** "What sort of visible loading state would provide value? While we debate that, let's fix the light mode token, send the client-facing details, and tighten up the code hygiene. Let's exempt trivial helpers from the doc-block rule. Only add a doc-block to methods that could read as genuinely ambiguous or confusing. We probably should add a 30-day table. Let's add a toggle to switch between the single-day view and the table view. We can get into specifics last after the other changes have been made."

**Why:** I asked Claude to fix the low-risk findings first, and then gave my authoritative decision on the two design questions regarding the loading state and table.

**Outcome:**
- **Contrast:** light-mode `--color-focus-ring` went from `#0fb89a` (2.52:1) to `#0b8f78`. That is the closest shade of the same mint that reaches 3:1 on every light surface (3.27:1 at worst, on `--color-surface-muted`). Dark mode is unchanged.
- **Error details:** `AppError` gained a `publicDetail` getter. Client errors (400, 404) still send their message, which only describes the caller's input. `UpstreamResponseError` and `UpstreamUnavailableError` send a fixed sentence, and Zod issues, Yahoo codes and raw statuses stay in the log. New route test: upstream internals never appear in the body.
- **Hygiene:**
  - removed `silentLogger`, `ApiError.status` (only a test read it) and the six unused tokens;
  - un-exported `isValidBar`, `PLACEHOLDER`, `NEUTRAL_BAND`, `YAHOO_INTERVAL`, `DAILY_SUMMARY_ROUTE`, `PROBLEM_CONTENT_TYPE`, `classifyStatus` and `readProblemDetails`;
  - fixed the stale `trendLabels` doc;
  - the contract test is out of `npm test` and runs with `npm run test:contract`, using the exported `WINDOW_DAYS`/`FETCH_BUFFER_DAYS` instead of copies.
- **Ineffective memo:** the AI first memoized `availableDays` in `App`. The React Compiler lint rejected that, because the value comes from a selector that is not memoized. It removed the two `useMemo` calls in `TradingDayPicker` instead, since the work is at most about 22 items.
- **Doc-block rule (my decision):** `CLAUDE.md`, the README and the AI's memory now say a block is added only where a function could read as ambiguous or surprising. The AI removed 66 of 157 blocks. It kept every block that explains a reason, precondition, edge case or caller contract. Comment lines went from about 33% to about 25% of source.
- 373 offline tests pass (177 backend, 196 frontend), and the live contract test passes on its own. Lint, typecheck, format and build are clean.
- **Not changed:** the body-read timeout status (502 vs 503) and the undrained final response body. Both are low value.
- **Open:** loading-state design and the table's specifics.

## Entry 39 - Spinner, and a 30-day Table view from my mockups (2026-10-10)

**Prompt (summarized):** Implement the spinning search button and ignore repeat submits while loading. For the table:
1. A two-option "Day" / "Table" toggle, in the toolbar row but right-justified, with Day as the default.
2. Newest day first.
3. Up/down/neutral glyphs on every row.
4. Clicking a row opens it in the Day view and shows a back arrow, but only when the day was opened that way. The arrow returns to the table, scrolled to that row.
5. The table panel scrolls vertically on desktop and mobile, but the main body must not.

I added two table mockups and asked for them to be reviewed first.

**Why:** The brief asks for "a table, chart, or both"; the Day view alone left that open. I wanted feedback that a search is running, without flicker for fast answers.

**Outcome:**
- **AI checked the mockups first:** my first folder copy didn't contain the new images, and the AI said so instead of guessing. After I replaced the folder, it found three things the mockups disagree on or leave out, and asked:
  - the desktop table has no date picker but the mobile one does; I chose to **hide it in Table view**;
  - the headers differ ("Date | Volume | Low Avg. | High Avg." vs "Day | Vol. | …"); I chose **full names on desktop, short on mobile**;
  - the back button isn't drawn; I chose **"← Back to table", just left of the toggle**.
- **Spinner:** `useDelayedFlag` shows the spinner only after 300 ms, so cached answers never flicker. The form ignores submits while busy and marks the button `aria-disabled`, which keeps its focus. The input stays editable. The spinner stops rotating under reduced motion.
- **Table:** `SummaryTable` lists every day newest first. Each row's date is a real button, and a click anywhere on the row opens it. A visible note explains the arrows, and each value's caption is read to screen readers only. The header row stays pinned, and only the panel scrolls (capped at 70% of the viewport height on mobile).
- **Navigation:** `useViewMode` remembers the row that opened the Day view. "Back to table" takes focus when it appears, because the row's button has unmounted. Going back focuses and scrolls to that row. The toggle or a new search forgets the row.
- **No duplication:** the field labels moved to `content/metricLabels.ts`, shared by the cells and the table headers. `buildComparison` moved out of `MetricGrid`, so both views apply one trend rule.
- **New copy, pending my approval:** the note "Arrows compare each day with Oct 9th, the latest day.", the screen-reader hint "Opens this day in the Day view.", and the screen-reader names "View" (toggle group) and "Daily summaries" (table). Each is pinned by an exact-string test.
- **AI slips, caught before handing over:** the new table test first used non-null assertions and a method reference that lint rejects, and one assertion matched raw text ("DayDay") instead of accessible names. All were fixed.
- 393 offline tests pass (177 backend, 216 frontend). Lint, typecheck, format and build are clean.
- **Pending my visual and keyboard QA:** light and dark mode, desktop and phone widths, and long volumes on a narrow phone.

## Entry 40 - Table QA: value alignment (2026-10-10)

**Prompt:** "For the columns with indicator symbols, can we justify the text to the left so that the 'in progress day' never resides over the indicator icon of the row below it?" (with a desktop screenshot of the table)

**Why:** In this last round of browser QA, the latest row without any glyphs ended its right-aligned numbers exactly where the rows below showed their arrows, so the columns looked jagged and uneven. A minor nitpick, but important to me.

**Outcome:**
- Kept my fix as asked: every table column and header is left-aligned, so each value starts at the same edge and the glyphs trail it. Changed only `SummaryTable.module.css`, with a comment explaining why the columns are not right-aligned.
- AI explained the cause: right alignment plus a missing glyph on the baseline row. Build and format are clean; no test change, since alignment is visual.
- Pending my re-check in the browser.

## Entry 41 - Mobile QA: "Back to table" placement (2026-10-10)

**Prompt:** "The mobile view looks good except for one change -- I'd like the Back to Table button on Mobile to be left-aligned underneath the date button, so that it looks like a cohesive layout. Desktop works and looks as expected." (with two mobile screenshots)

**Why:** On a phone, the back button and toggle were too wide to fit beside the date button, so they wrapped together onto a third row, right-aligned. That left the date button alone on its row and looked out of place. Again, another minor nitpick but those small concessions add up.

**Outcome:**
- On mobile only, the view-controls group dissolves (`display: contents`). The date button and the Day/Table toggle share the second row at opposite edges, as in my mobile table mockup. "Back to table" takes the third row, left-aligned under the date button, and the warning follows it. Desktop is unchanged.
- This needed two small wrapper slots in `App.tsx`, so CSS can place the back button and the toggle independently.
- **Trade-off the AI flagged:** the DOM order is still date button → back → toggle, which keeps desktop's left-to-right order. On mobile, Tab therefore goes from the date button down to the back button and then up to the toggle. Mobile Tab use is rare, and the back button already takes focus when it appears.
- 216 frontend tests pass. Lint, format and build are clean. Pending my re-check on a phone-width window.

## Entry 42 - Sweep of the table work, and a third review brief (2026-10-10)

**Prompt:** "Perfect, it looks and behaves exactly how I expected. Now I would like for you to do a comprehensive sweep of the code (focusing more on the table inclusion and code), then update overview analysis for a new session to take a look at."

**Why:** The session that built the Table view is not an unbiased reviewer of it. I once again asked it to overwrite the brief so that the next session could start with the context but without the bias, just like in Entries 31 and 36.

**Outcome:**
- AI re-read the new and changed files, scanned for unused exports, recalculated contrast for the new UI states, and re-ran every check: 393 tests, lint, typecheck, format and build are clean.
- New findings, recorded in `overview analysis.md` and **not yet fixed**:
  - the focus ring on the *selected* Day/Table option is nearly invisible (1.41:1 light, 1.93:1 dark), because it is drawn inset over the brand fill;
  - in light mode, the green up-glyph is 2.78:1 on a hovered table row;
  - a text-selection drag inside a row opens the Day view;
  - table headers are data-driven but rows are hard-coded, and the `Comparison` type sits in `metrics/cells` while `table/` uses it;
  - the sticky header's border may vanish with collapsed borders (to verify).
- The brief also asks the next reviewer to scrutinize this session's own changes. That covers the view-mode and focus transitions, the busy guard blocking all searches during an outage, the `publicDetail` errors, the 66 doc-block removals, and the contract test leaving `npm test`.
- It flags that the new copy (the table note, the row hint, and the "View" and "Daily summaries" names) still needs my explicit approval.
- No code changed in this entry.

## Entry 43 - Third independent review: scope, readability, architecture (2026-10-10)

**Prompt (summarized):** Analyze the code in a fresh session against the brief and `overview analysis.md`. Focus on three questions: is it over-engineered for its scope, and are the tests thorough or bloated? Could a newcomer understand it, and are the decisions documented? Is the folder and class structure sensible, or does it read as AI spaghetti?

**Why:** The previous session wrote the Table view and also wrote the brief, so a reviewer without that context was needed to ensure an unbiased review.

**Outcome (findings only, no code changed):**
- Re-ran every check: 177 backend and 216 frontend tests pass, and lint, typecheck and Prettier are clean. The toggle focus-ring finding (§5.1) is still open.
- Verdict: the code is layered and consistent, not spaghetti. It sits at the upper edge of what the scope needs, but each extra piece is contained and tested.
- New findings the brief missed:
  - the busy guard makes the abort and request-id logic unreachable from the UI, so two mechanisms solve the same problem;
  - `buildComparison` puts JSX inside a data object, and the table imports it from `metrics/`;
  - several UI strings live outside `content/` ("Search", "Daily summary", "Back to top", "Skip to main content", "No data", "Stock symbol", the "AAPL" placeholder), although the docs say all copy does;
  - `domain/symbol.ts` throws an HTTP-shaped error;
  - the service depends on the concrete `InFlightDeduper` class rather than an interface;
  - the README gives the bundle as 117 KB, while the brief says 119 KB;
  - `overview analysis.md` sits at the repo root, written in the AI's voice and listing defects that are still open.
- Tests are proportionate (about 0.9 test lines per source line). A few behaviors are tested at three layers (cache TTL, invalid symbol, retained data), which goes against the project's own one-layer rule.

## Entry 44 - Acting on the third review (2026-10-10)

**Prompt (summarized):** Fix the toggle focus ring. Approve the table copy as written. Let a new symbol search while one runs, ignoring only repeats. Move all inline strings into `content/`. Move the comparison out of `metrics/` and have each view render the glyph. Trim the duplicated tests. Remove the `@param` noise. `overview analysis.md` will not be committed.

**Why:** The review showed that the busy guard left the cancellation logic with nothing to do, and that the docs claimed all copy lived in `content/` when it did not. The tests and doc blocks also had padding you guys would probably notice, so I directed Claude to fix the dead cancellation logic, put copy back into `content/`, and trim bloated comments and documentation.

**Outcome:**
- **Focus ring:** the pressed Day/Table option now draws its ring in `--color-on-brand`, set in 5 px from the edge. That is 5.70:1 in light mode and 7.63:1 in dark (it was 1.41:1 and 1.93:1).
- **Table copy approved** as written: the arrow note, the row hint, and the "View" and "Daily summaries" names.
- **Search:**
  - `useSymbolSearch` now ignores only a repeat of the symbol already loading. `search` returns false in that case, so `App` doesn't reset the selection for a no-op.
  - Any other submit cancels the running request, and so does rejected input, which previously would have left that request running.
  - The form no longer has its own guard and no longer sets `aria-disabled`. It keeps `aria-busy` and the delayed spinner.
- **Copy:** the remaining inline strings moved to `content/`, unchanged, in `searchCopy.ts`, `layoutCopy.ts` and `metricGridCopy` in `metricLabels.ts`. The strings were "Search" (page title and button), "Stock symbol", "AAPL", "Skip to main content", "Back to top", "Daily summary", "---" and "No data".
- **Comparison:** `components/indicators/comparison.ts` now returns plain data, `{ trend, caption }`. `MetricCell` and the table's `ValueCell` each render `<TrendIndicator>` themselves, and the table no longer imports from `metrics/`.
- **Tests:**
  - Removed 13 duplicated tests:
    - all 3 `joinClassNames` tests;
    - `sum`, which is no longer exported, and the single-element `mean` case;
    - the service's 2-minute TTL test and its empty-list test (covered by the integration test, the domain and the route);
    - one of the integration test's malformed symbols;
    - a duplicate malformed-key test in the formatting tests;
    - a duplicate "No data" test in the grid tests, whose check was folded into the surviving test;
    - "starts idle" in both the reducer and the hook;
    - the hook's "never loaded" retention test (covered by the `App` new-session outage test).
  - Added 2 hook tests: a repeat search is ignored until it settles, and rejected input cancels the running search.
  - Now 382 offline tests: 172 backend, 210 frontend.
- **Doc blocks:** removed 210 of 216 `@param`/`@returns` lines that restated the name, type or summary. The 6 kept state real contracts: non-empty bars, a non-negative price, a schema-validated payload, a zero-based retry index, a possibly retryable final response, and an error that is returned rather than thrown. `CLAUDE.md` records the revised rule.
- Updated `CLAUDE.md`, `README.md` (test counts, search accessibility, the bundle size measured at 120 KB) and `frontend/setup.md`. Lint, typecheck, Prettier, the build and all tests are clean.
- **Pending my browser QA:** the focus ring on the pressed toggle (light and dark), and searching a new symbol while a slow search runs.

## Entry 45 - Bug: Table view fell back to the Day view while loading (2026-10-10)

**Prompt:** "I found a behavioral bug. If I'm in Table view and I search a new symbol, the main body switches to the Day view while loading, then changes back to table view with the populated data. The view should be retained while loading, regardless of whether you're on day or table view."

**Why:** I found this bug in my round of browser QA. The view jumping during a search is jarring, and the same thing would happen after any failure. Unacceptable, so it needed to be fixed.

**Outcome:**
- **Cause (AI diagnosis):** `App` rendered the table only when a latest day existed. Retained data is same-symbol only, so a new symbol has no data while it loads, and `App` fell back to the Day grid. The toggle was gated the same way, so it disappeared too.
- **Fix:**
  - In Table view the table always renders. Without data it keeps its headers and shows one `---` row, read as "No data", and drops the arrow note.
  - The toggle stays visible whenever Table view is selected.
  - The same applies to failures and to a symbol with no trades.
- The `---` / "No data" pair is now one shared `EmptyValue` component, used by the Day cells and the table. Its copy moved, unchanged, to `emptyValueCopy` in `content/metricLabels.ts`.
- **Tests:**
  - an `App` regression test: Table view stays put while a new symbol loads, then shows that symbol's rows;
  - a `SummaryTable` test for the no-data row.
  - Now 384 offline tests. Lint, typecheck, Prettier and the build are clean.
- **Pending my browser QA:** the placeholder row on desktop and mobile.

## Entry 46 - Keep the whole layout while data is missing (2026-10-10)

**Prompt:** "I want all elements aside from the cell content to remain visible. This would mean: the 'Arrows compare each day with Oct 9th, the latest day.' copy; the Day/Table toggle; the table should contain 30 dummy rows with --- data in each cell to resemble a skeleton shimmer; the date picker."

**Why:** After the last prompt (Entry 45), the table stayed, but the note and the picker still disappeared while loading. I wanted only the values to change so that there weren't any egregious visual flickers while new data was populating the page.

**Outcome:**
- **AI asked four questions first**, because one touches user-authored copy. My answers:
  - the note uses generic wording without data: "Arrows compare each day with the latest day.";
  - the picker shows "---" and is unavailable;
  - the elements stay visible once a search has shown data (before any search the page is unchanged), through loading, failures and no-trade results;
  - the skeleton shimmers while a search runs.
- **Implementation:**
  - A small `useLatchedFlag` hook remembers that data has been shown, so `App` keeps the picker and toggle from then on.
  - `TradingDayPicker` accepts a missing day: it shows "---", is `aria-disabled` (so it stays focusable and named) and opens nothing.
  - `comparisonNoteFor` falls back to the generic note.
  - `SummaryTable` renders 30 skeleton rows. A glow sweeps across each "---" while a search runs, and it is static under reduced motion. Only the first row is announced, so screen readers don't hear "No data" 120 times.
- **Tests:**
  - the table test now checks the generic note, the 30 rows and the single announced row;
  - a new `App` test: after a not-found, the Day view keeps the picker (as "---", unavailable) and the toggle;
  - the copy test pins the generic note.
  - Now 385 offline tests. Lint, typecheck, Prettier and the build are clean.
- **Pending my browser QA:** the shimmer in light and dark mode, the disabled picker's look, and the skeleton on mobile.

## Entry 47 - Sweep of Entries 44-46, and a fourth review brief (2026-10-10)

**Prompt:** "Everything looks and behaves great! Let's have you perform your own analysis and overwrite overview analysis for a new session to review."

**Why:** The session that made these changes was, again, not an unbiased reviewer of itself. I once again had it overwrite the written brief so that the next session has the context without the bias, just like before.

**Outcome:**
- AI re-ran every check, including the live contract test: 385 offline tests, lint, typecheck, format and build are clean. It re-measured size and comment density, scanned for unused exports, and calculated contrast for the new visual states.
- **New findings** for the next reviewer, **not yet fixed**:
  - `README.md` and `frontend/setup.md` don't describe the missing-data behavior;
  - the skeleton's "---" is 3.11:1 in light mode, the same color as the Day cells' placeholder;
  - the calendar's open state isn't reset when the picker becomes unavailable (possibly unreachable);
  - `App` has no test that an ignored repeat search keeps the chosen day;
  - `SummaryTable.tsx` and `content/metricLabels.ts` are growing.
- Open items carried over: the prompt-log voice, the hovered-row glyph contrast, the selection-drag click, the table column config, round 3's architecture leaks, and the browser and screen-reader passes.
- The brief asks the next reviewer to scrutinize this session's own changes most closely.
- No code changed in this entry. `overview analysis.md` stays uncommitted.

## Entry 48 - Fourth independent review: scope, readability, architecture (2026-10-10)

**Prompt (summarized):** Analyze the code in a fresh session against the brief and `overview analysis.md`, with the same three questions as Entry 43: over-engineering and test bloat, readability for a newcomer, and whether the structure reads as AI spaghetti.

**Why:** Entries 44-46 were written and then summarized by the same session, so their own changes needed an outside check before the final tidy-up.

**Outcome (findings only, no code changed):**
- Re-ran every check: 172 backend and 213 frontend tests pass, and lint, typecheck and Prettier are clean.
- Verdict: the structure is layered and one-directional, with no import cycles. It is not spaghetti. The size comes from features added beyond the brief, not from extra layers.
- Search concurrency (A → B → A, A → invalid → A, unmount) traced correct. The calendar's stale `isOpen` is reachable only through a rare same-symbol `notFound`.
- Confirmed: the README and `frontend/setup.md` still don't describe the missing-data behavior.
- New: several component doc blocks (`App`, `SummaryTable`, `TradingDayPicker`, `MetricGrid`) describe product behavior that already lives in `CLAUDE.md` and the README, so they will drift. `content/metricLabels.ts` holds structure (`MetricField`, `METRIC_FIELDS`) as well as copy.
- Tests are proportionate. A few low-value ones remain, but trimming them this late isn't worth the churn.

## Entry 49 - Acting on the fourth review: docs, doc blocks, metric fields (2026-10-10)

**Prompt (summarized):** Add the missing-data behavior to the README and `frontend/setup.md`. Shorten the four long component doc blocks and drop the ones that only restate names. Move `MetricField` out of `content/`. Skip the optional popover fix and the `App` test. I will rewrite the "Why" lines myself.

**Why:** These were the review's findings that you guys would probably notice first. The skipped items protect a very rare path and in my opinion didn't add much value this late in the project.

**Outcome:**
- **Docs:** the README's decisions table has a "Data missing on screen" row, and its Accessibility section covers "No data", the `aria-disabled` picker and the skeleton announced once. `frontend/setup.md` has a "When data is missing" section, and its layout listing names the new file.
- **Doc blocks:**
  - `App`, `SummaryTable`, `TradingDayPicker` and `MetricGrid` are cut to 2-3 lines each. They keep only the non-obvious reasons: the row button's click bubbling to the row, `aria-disabled` rather than `disabled`, and Safari's list semantics.
  - The blocks on `formatPrice`, `buildDailySummaryUrl` and `Logo` are removed, leaving 99 doc blocks.
- **Metric fields:** `MetricField` and `METRIC_FIELDS` moved to `domain/metricFields.ts`, so `content/metricLabels.ts` holds only copy. No copy changed.
- Frontend tests (213), lint, typecheck and Prettier are clean.

## Entry 50 - Remaining minor architecture findings (2026-10-10)

**Prompt:** "Let's also fix the minor issues if your confidence that those fixes won't introduce new issues is high or near absolute."

**Why:** If a change required large sweeping effort or if Claude wasn't confident that these changes wouldn't introduce new problems, I didn't want to make those changes. We were close to being done.

**Outcome:**
- **Fixed:** `DailySummaryService` now depends on a new `RequestCoalescer` interface (`infra/cache/requestCoalescer.ts`) rather than the concrete `InFlightDeduper`, matching how it already uses `Cache`. The change is type-only: no runtime behavior changed.
- **Documented instead of fixed:** `domain/symbol.ts` throwing the HTTP-aware `InvalidSymbolError`. Changing it would rework the error flow and its tests across layers, which is not a near-zero-risk change. It is listed under the README's known limitations, with the point at which it would be worth changing.
- **Left as is:** `content/warningMessages.ts` imports only a type from `state/`, so the dependency stays one-way and acyclic.
- All 385 tests, lint, typecheck, Prettier and the build are clean.

---

## Manual changes (outside AI)

Work I did myself, outside the AI, and why:

- **Table mockups (Entry 39):** I drew `Desktop Table View.png` and `Mobile Table Layout.png` to define the new Table view before any of it was built.
- **UI mockups (`Mockups for Symbol Search App/`):** I drew all 8 mockups (4 desktop, 4 mobile: before search, results, new-session failure, same-session failure) before any UI code existed, so the AI implemented my design rather than inventing one.
- **All git operations and commit messages:** I made every commit myself after reviewing each step. The AI drafted messages on request, but for the first commit I **rewrote its suggested title format** (`feat(backend): ...`) into my own convention, `Feature/<Area>-Implementation: <summary>`, and the AI adopted it for every later draft. Keeping commits manual meant nothing reached the history without my sign-off.
- **Visual and keyboard QA:** I ran the app in my browser after each UI step, testing desktop, mobile width and keyboard-only use, and reported the issues in Entries 21, 22, 24, 25 and 26 with screenshots. I declined the AI's offer to install a headless browser for its own screenshots, so that this review stayed with me.
- **2026-10-10, `backend/src/infra/http/fetchWithRetry.ts`:** I added a blank line inside `HttpGetRequest`. It contained trailing whitespace, which failed Prettier and `.editorconfig`. The AI flagged it before drafting the step 4 commit message, and I reverted it to keep the codebase format-clean. Net change: none.
