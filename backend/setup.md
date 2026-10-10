# Backend setup

Fastify + TypeScript API that aggregates Yahoo Finance 15-minute bars into per-day summaries for the last 30 days.

## Prerequisites

- **Node.js 22.12 or newer** (`node --version`). Vitest 5 requires it.
- npm 10 or newer (bundled with Node).
- Outbound HTTPS access to `query1.finance.yahoo.com` for live data. The tests still pass offline.

## Install

From the **repository root**, which installs every workspace:

```bash
npm install
```

## Run

```bash
# Development, with auto-reload on file changes
npm run dev --workspace backend        # or: cd backend && npm run dev

# Production
npm run build --workspace backend
npm start --workspace backend
```

The API listens on `http://127.0.0.1:3000` by default.

## Try it

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/api/v1/stocks/TSLA/daily-summary
```

| Request | Result |
|---|---|
| `GET /api/v1/stocks/{symbol}/daily-summary` | `200` with `[{ "day", "lowAverage", "highAverage", "volume" }]`, ascending by day |
| Malformed symbol, e.g. `bad!sym` | `400` `application/problem+json` (`/problems/invalid-symbol`) |
| Unknown symbol, e.g. `ZZZZNOTREAL` | `404` (`/problems/symbol-not-found`) |
| Yahoo returned an unusable payload | `502` (`/problems/upstream-bad-response`) |
| Yahoo unreachable after retries | `503` (`/problems/upstream-unavailable`) |
| `GET /health` | `200 {"status":"ok"}` (does not call Yahoo) |

Symbols are case-insensitive and may contain letters, digits, `.`, `-`, `^` and `=` (e.g. `BRK.B`, `%5EGSPC` for `^GSPC`).

## Test

```bash
npm test --workspace backend            # all tests
npm run test:coverage --workspace backend
npm run typecheck --workspace backend
npm run lint                            # from the repo root
```

The contract test (`test/contract`) calls the **real** Yahoo API. It uses the canned capture in `test/fixtures/yahoo` only when Yahoo is unreachable. To force that offline path:

```bash
CONTRACT_YAHOO_BASE_URL=http://127.0.0.1:9 npm test --workspace backend
```

## Configuration

Everything is set by environment variables, and every one is optional. Invalid values stop startup with a message naming each bad variable.

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address (use `0.0.0.0` in containers) |
| `PORT` | `3000` | Listen port |
| `LOG_LEVEL` | `info` | `fatal` `error` `warn` `info` `debug` `trace` `silent` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated origins allowed to call the API |
| `YAHOO_BASE_URL` | `https://query1.finance.yahoo.com/v8/finance/chart` | Upstream chart endpoint |
| `YAHOO_USER_AGENT` | Browser-like UA | Yahoo rejects requests without one (HTTP 429) |
| `UPSTREAM_TIMEOUT_MS` | `5000` | Timeout per upstream attempt |
| `UPSTREAM_MAX_RETRIES` | `2` | Retries after the first attempt (0-5) |
| `UPSTREAM_RETRY_BASE_DELAY_MS` | `200` | Backoff base (full jitter) |
| `UPSTREAM_RETRY_MAX_DELAY_MS` | `2000` | Backoff and `Retry-After` cap |
| `CACHE_TTL_MS` | `120000` | Per-symbol cache lifetime (2 minutes) |
| `CACHE_MAX_ENTRIES` | `500` | Cache size bound (oldest evicted first) |
| `WINDOW_DAYS` | `30` | Rolling window, from midnight exchange time |
| `FETCH_BUFFER_DAYS` | `2` | Extra days fetched before trimming to the exact window |

Example: `PORT=8080 LOG_LEVEL=debug npm run dev --workspace backend`

## Project layout

```
src/
  server.ts          Process entry: config, listen, graceful shutdown
  app.ts             Fastify wiring (CORS, error handling, routes); no listening
  container.ts       Composition root: builds the concrete object graph
  config/            Env parsing and validation (Zod)
  http/              Routes, RFC 7807 problem details, global error handling
  services/          DailySummaryService (use-case orchestration)
  providers/         MarketDataProvider interface + Yahoo implementation
  infra/             fetch with retry/timeout, TTL cache, request coalescing, clock, logger
  domain/            Pure logic: windowing, timezone day keys, aggregation, rounding
test/                Mirrors src/; fixtures/ holds Yahoo captures
```
