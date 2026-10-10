import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AppError } from '../errors/appErrors.js';
import {
  isAppError,
  problemFromAppError,
  problemFromStatus,
  sendProblem,
} from './problemDetails.js';

const GENERIC_SERVER_ERROR = 'An unexpected error occurred. Please try again later.';

/**
 * Rocko Bishop
 * Installs the global error and not-found handlers. Every failure leaves the API as an RFC 7807
 * response, and no handler needs its own try/catch.
 */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler(handleError);
  app.setNotFoundHandler(handleNotFound);
}

/**
 * Rocko Bishop
 * Central error mapping: known application errors keep their status, framework 4xx errors keep
 * theirs, and anything else becomes a generic 500 whose details are logged but never sent.
 */
function handleError(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  if (isAppError(error)) {
    logAppError(request, error);
    return sendProblem(reply, problemFromAppError(error, request.url));
  }

  const clientStatus = frameworkClientStatus(error);
  if (clientStatus !== undefined) {
    request.log.info({ err: error }, 'Rejected malformed request');
    return sendProblem(reply, problemFromStatus(clientStatus, error.message, request.url));
  }

  request.log.error({ err: error }, 'Unhandled error');
  return sendProblem(reply, problemFromStatus(500, GENERIC_SERVER_ERROR, request.url));
}

function handleNotFound(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  return sendProblem(
    reply,
    problemFromStatus(404, `No route matches ${request.method} ${request.url}`, request.url),
  );
}

/**
 * Rocko Bishop
 * Logs application errors at a severity that matches who is at fault: upstream trouble is a
 * warning operators should see, while client mistakes are informational.
 */
function logAppError(request: FastifyRequest, error: AppError): void {
  const details = { err: error, status: error.status };
  if (error.status >= 500) {
    request.log.warn(details, error.title);
  } else {
    request.log.info(details, error.title);
  }
}

/**
 * Rocko Bishop
 * Extracts the status of a framework-raised client error (malformed URL, unsupported media type,
 * ...), which is safe to report as-is.
 */
function frameworkClientStatus(error: FastifyError | Error): number | undefined {
  const status = 'statusCode' in error ? error.statusCode : undefined;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}
