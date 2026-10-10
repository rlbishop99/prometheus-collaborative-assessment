import { z } from 'zod';

/*
 * Only the fields this service uses are declared; Zod strips everything else, so unrelated
 * additions to Yahoo's payload cannot break parsing. The quote arrays and `timestamp` are
 * optional because Yahoo omits them entirely for ranges with no trades
 * (`indicators.quote: [{}]`).
 */

const nullableNumberSeries = z.array(z.number().nullable());

const quoteSchema = z.object({
  low: nullableNumberSeries.optional(),
  high: nullableNumberSeries.optional(),
  volume: nullableNumberSeries.optional(),
});

const resultSchema = z.object({
  meta: z.object({
    symbol: z.string().min(1),
    exchangeTimezoneName: z.string().min(1),
  }),
  timestamp: z.array(z.number()).optional(),
  indicators: z.object({
    quote: z.array(quoteSchema),
  }),
});

const chartErrorSchema = z.object({
  code: z.string(),
  description: z.string().nullish(),
});

export const yahooChartResponseSchema = z.object({
  chart: z.object({
    result: z.array(resultSchema).nullish(),
    error: chartErrorSchema.nullish(),
  }),
});

export type YahooChartResponse = z.infer<typeof yahooChartResponseSchema>;
export type YahooChartResult = z.infer<typeof resultSchema>;
export type YahooQuote = z.infer<typeof quoteSchema>;
export type YahooChartError = z.infer<typeof chartErrorSchema>;
