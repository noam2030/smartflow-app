import type { ErrorDetail } from '../types/issues.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ErrorDetail[];

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details: ErrorDetail[] = []
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request payload. Title and description are required.', details: ErrorDetail[] = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class InvalidQueryParameterError extends AppError {
  constructor(message: string, details: ErrorDetail[] = []) {
    super(message, 400, 'INVALID_QUERY_PARAMETER', details);
  }
}

export class InvalidIdFormatError extends AppError {
  constructor(message = 'The provided issue ID must be a valid UUID.', details: ErrorDetail[] = []) {
    super(message, 400, 'INVALID_ID_FORMAT', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'ISSUE_NOT_FOUND', details: ErrorDetail[] = []) {
    super(message, 404, code, details);
  }
}

export class AiAnalysisError extends AppError {
  constructor(message = 'The AI classification service failed to evaluate the report text.', details: ErrorDetail[] = []) {
    super(message, 422, 'AI_ANALYSIS_FAILED', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred.', details: ErrorDetail[] = []) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}
