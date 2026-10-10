import type { FastifyInstance } from 'fastify';

import type { DailySummaryReader } from '../../services/dailySummaryService.js';

const DAILY_SUMMARY_ROUTE = '/api/v1/stocks/:symbol/daily-summary';

/**
 * Serialization schema for the success body. Fastify compiles it into a dedicated serializer
 * (faster than JSON.stringify) and it guarantees that only the four contract fields are emitted.
 */
const dailySummaryResponseSchema = {
  200: {
    type: 'array',
    items: {
      type: 'object',
      required: ['day', 'lowAverage', 'highAverage', 'volume'],
      additionalProperties: false,
      properties: {
        day: { type: 'string' },
        lowAverage: { type: 'number' },
        highAverage: { type: 'number' },
        volume: { type: 'integer' },
      },
    },
  },
} as const;

interface DailySummaryRoute {
  Params: { symbol: string };
}

/**
 * Rocko Bishop
 * Registers `GET /api/v1/stocks/:symbol/daily-summary`. The handler only delegates: validation,
 * caching and aggregation live in the service, and errors flow to the global handler.
 */
export function registerDailySummaryRoute(app: FastifyInstance, reader: DailySummaryReader): void {
  app.get<DailySummaryRoute>(
    DAILY_SUMMARY_ROUTE,
    { schema: { response: dailySummaryResponseSchema } },
    async (request) => reader.getDailySummaries(request.params.symbol),
  );
}
