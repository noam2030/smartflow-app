import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import type { ApiErrorResponse, ErrorDetail } from '../types/issues.js';

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // If it's already an instance of AppError
  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
    };
    return reply.status(error.statusCode).send(response);
  }

  // If it's a ZodError
  if (error instanceof ZodError) {
    const details: ErrorDetail[] = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues[0]?.message || 'Validation failed.',
        statusCode: 400,
        details,
      },
    };
    return reply.status(400).send(response);
  }

  // Fastify route validation errors
  if ('validation' in error && (error as FastifyError).validation) {
    const fastifyError = error as FastifyError;
    const details: ErrorDetail[] = [
      {
        field: (fastifyError.validationContext ? `${fastifyError.validationContext}.` : '') + (fastifyError as any).validation[0]?.instancePath || '',
        message: fastifyError.message,
      },
    ];

    let code = 'VALIDATION_ERROR';
    if (fastifyError.validationContext === 'querystring') {
      code = 'INVALID_QUERY_PARAMETER';
    } else if (fastifyError.validationContext === 'params') {
      code = 'INVALID_ID_FORMAT';
    }

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message: fastifyError.message,
        statusCode: 400,
        details,
      },
    };
    return reply.status(400).send(response);
  }

  // Default internal server error (500)
  request.log.error(error);
  const statusCode = (error as any).statusCode || 500;
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      statusCode,
      details: [],
    },
  };
  return reply.status(statusCode).send(response);
}
