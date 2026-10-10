import { z } from 'zod';

/**
 * Runtime check of the success body, so a contract break fails loudly instead of rendering NaN.
 * Zod 4's `z.number()` already rejects NaN and Infinity.
 */
export const dailySummariesSchema = z.array(
  z.object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lowAverage: z.number(),
    highAverage: z.number(),
    volume: z.number().int().nonnegative(),
  }),
);

/** RFC 7807 problem body. Every field is optional, so foreign or partial problems still parse. */
export const problemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
