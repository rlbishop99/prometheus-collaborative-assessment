import { STATUS_CODES } from 'node:http';

import type { FastifyReply } from 'fastify';

import { AppError } from '../errors/appErrors.js';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** RFC 7807 problem details body. */
export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
}

export function problemFromAppError(error: AppError, instance: string): ProblemDetails {
  return {
    type: error.type,
    title: error.title,
    status: error.status,
    detail: error.publicDetail,
    instance,
  };
}

/**
 * Rocko Bishop
 * Builds a problem body from a bare HTTP status. It is used for framework errors and for the
 * generic 500, whose internal message must never reach the client.
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

export function sendProblem(reply: FastifyReply, problem: ProblemDetails): FastifyReply {
  return reply.status(problem.status).type(PROBLEM_CONTENT_TYPE).send(problem);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
