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

const ALLOWED_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export const issueStatusSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.enum(ALLOWED_STATUSES, {
    errorMap: () => ({
      message: 'Status must be one of: open, in_progress, resolved (or OPEN, IN_PROGRESS, RESOLVED, CLOSED).',
    }),
  })
);

export const AIAnalysisSchema = z.object({
  category: issueCategorySchema,
  urgency: issueUrgencySchema,
  priority: issuePrioritySchema.optional(),
  confidenceScore: z.number().min(0.0).max(1.0),
  summary: z.string().min(5).max(300),
  reasoning: z.string().min(10).max(500),
  suggestedAction: z.string().min(5).max(300),
});

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
