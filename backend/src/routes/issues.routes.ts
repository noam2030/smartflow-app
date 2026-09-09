import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { IssuesController } from '../controllers/issues.controller.js';
import {
  createIssueSchema,
  getIssueParamsSchema,
  getIssuesQuerySchema,
} from '../schemas/issues.schemas.js';
import {
  InvalidIdFormatError,
  InvalidQueryParameterError,
  ValidationError,
} from '../errors/app-error.js';

export interface IssuesRoutesOptions {
  controller: IssuesController;
}

export const issuesRoutes: FastifyPluginAsync<IssuesRoutesOptions> = async (
  fastify: FastifyInstance,
  options: IssuesRoutesOptions
) => {
  const { controller } = options;

  // POST /api/issues
  fastify.post(
    '/api/issues',
    {
      preValidation: async (request) => {
        const result = createIssueSchema.safeParse(request.body);
        if (!result.success) {
          const details = result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          }));
          throw new ValidationError(
            result.error.issues[0]?.message || 'Invalid request payload. Title and description are required.',
            details
          );
        }
        request.body = result.data;
      },
    },
    controller.createIssue
  );

  // GET /api/issues
  fastify.get(
    '/api/issues',
    {
      preValidation: async (request) => {
        const result = getIssuesQuerySchema.safeParse(request.query);
        if (!result.success) {
          const details = result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          }));
          throw new InvalidQueryParameterError(
            result.error.issues[0]?.message || 'Invalid query parameter.',
            details
          );
        }
        request.query = result.data;
      },
    },
    controller.getIssues
  );

  // GET /api/issues/:id
  fastify.get(
    '/api/issues/:id',
    {
      preValidation: async (request) => {
        const result = getIssueParamsSchema.safeParse(request.params);
        if (!result.success) {
          const details = result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          }));
          throw new InvalidIdFormatError(
            'The provided issue ID must be a valid UUID.',
            details
          );
        }
        request.params = result.data;
      },
    },
    controller.getIssueById
  );
};
