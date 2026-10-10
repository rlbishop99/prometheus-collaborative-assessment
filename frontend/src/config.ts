/** Frontend runtime settings. Build-time overrides use Vite's `VITE_*` environment variables. */
export const appConfig = Object.freeze({
  /** API origin; empty means same-origin (the Vite proxy in development). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  /**
   * Longer than the backend's worst case (3 upstream attempts x 5 s plus backoff, about 19 s), so
   * the backend reports its own 503 instead of the browser giving up first.
   */
  requestTimeoutMs: 25_000,
  /** Matches the agreed 2-minute freshness window. */
  cacheTtlMs: 120_000,
  cacheMaxEntries: 50,
});
