import { vi } from 'vitest';

import type { DailySummaryClient } from '../../src/api/dailySummaryClient';
import type { DailySummaries } from '../../src/domain/types';

export const tslaSummaries: DailySummaries = [
  { day: '2026-10-07', lowAverage: 370.1234, highAverage: 372.5, volume: 30_000_000 },
  { day: '2026-10-08', lowAverage: 375.25, highAverage: 377.0001, volume: 32_000_000 },
  { day: '2026-10-09', lowAverage: 383.0629, highAverage: 384.8882, volume: 36_336_060 },
];

export const nvdaSummaries: DailySummaries = [
  { day: '2026-10-09', lowAverage: 180.5, highAverage: 182.25, volume: 150_000_000 },
];

export const jsonResponse = (
  body: unknown,
  status = 200,
  contentType = 'application/json',
): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } });

export const problemResponse = (status: number, type: string, detail = 'detail'): Response =>
  jsonResponse({ type, title: 'Problem', status, detail }, status, 'application/problem+json');

/** Declared with a property so tests can reference the mock without unbound-method issues. */
export interface ClientMock extends DailySummaryClient {
  readonly fetchDailySummaries: ReturnType<typeof vi.fn<DailySummaryClient['fetchDailySummaries']>>;
}

export const clientMock = (): ClientMock => ({
  fetchDailySummaries: vi.fn<DailySummaryClient['fetchDailySummaries']>(),
});
