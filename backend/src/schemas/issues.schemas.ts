import { z } from 'zod';

export const issueCategorySchema = z.enum([
  'BUG',
  'FEATURE_REQUEST',
  'PERFORMANCE',
  'SECURITY',
  'BILLING',
  'GENERAL_INQUIRY',
]);

export const issuePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const issueUrgencySchema = issuePrioritySchema;

export const issueStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const createIssueSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string',
    })
    .min(3, 'title must be at least 3 characters long')
    .max(200, 'title must be at most 200 characters long'),
  description: z
    .string({
      required_error: 'Description is required',
      invalid_type_error: 'Description must be a string',
    })
    .min(10, 'description must be at least 10 characters long'),
});

export const getIssuesQuerySchema = z.object({
  category: issueCategorySchema.optional(),
  priority: issuePrioritySchema.optional(),
  urgency: issueUrgencySchema.optional(),
  status: issueStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'urgency', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce
    .number({ invalid_type_error: "Query parameter 'page' must be a valid number." })
    .int("Query parameter 'page' must be an integer.")
    .min(1, "Query parameter 'page' must be greater than or equal to 1.")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "Query parameter 'limit' must be a valid number." })
    .int("Query parameter 'limit' must be an integer.")
    .min(1, "Query parameter 'limit' must be greater than or equal to 1.")
    .max(100, "Query parameter 'limit' must be less than or equal to 100.")
    .default(20),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getIssueParamsSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'The provided issue ID must be a valid UUID.'),
});

export const updateIssueStatusSchema = z.object({
  status: issueStatusSchema,
});
