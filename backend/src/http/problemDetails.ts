import { STATUS_CODES } from 'node:http';

import type { FastifyReply } from 'fastify';

import { AppError } from '../errors/appErrors.js';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** RFC 7807 problem details body. */
export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
}

/**
 * Rocko Bishop
 * Builds the problem body for an application error. Each AppError carries its own status, type and
 * title, so no branching on error classes is needed here.
 * @param error - The application error.
 * @param instance - The request path that failed.
 * @returns The problem details body.
 */
export function problemFromAppError(error: AppError, instance: string): ProblemDetails {
  return {
    type: error.type,
    title: error.title,
    status: error.status,
    detail: error.message,
    instance,
  };
}

/**
 * Rocko Bishop
 * Builds a problem body from a bare HTTP status. It is used for framework errors and for the
 * generic 500, whose internal message must never reach the client.
 * @param status - The HTTP status.
 * @param detail - A safe, client-facing explanation.
 * @param instance - The request path that failed.
 * @returns The problem details body, with `type: about:blank` as RFC 7807 prescribes.
 */
export function problemFromStatus(
  status: number,
  detail: string,
  instance: string,
): ProblemDetails {
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    detail,
    instance,
  };
}

/**
 * Rocko Bishop
 * Sends a problem response with the RFC 7807 media type.
 * @param reply - The Fastify reply.
 * @param problem - The body to send.
 * @returns The reply, for chaining or returning from a handler.
 */
export function sendProblem(reply: FastifyReply, problem: ProblemDetails): FastifyReply {
  return reply.status(problem.status).type(PROBLEM_CONTENT_TYPE).send(problem);
}

/**
 * Rocko Bishop
 * Type guard for application errors, so the error handler can narrow unknown thrown values.
 * @param error - Any thrown value.
 * @returns True when `error` is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
