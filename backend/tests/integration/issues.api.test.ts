import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Issues API Integration Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      dbPath: ':memory:',
      logger: false,
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/issues', () => {
    it('creates an issue with AI enrichment (201)', async () => {
      const payload = {
        title: 'Production checkout fails on credit card submission',
        description:
          'When users attempt to submit payment on the checkout page, the request times out after 30 seconds and returns a 504 gateway timeout. Customers are completely unable to complete purchases.',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(body.data.title).toBe(payload.title);
      expect(body.data.description).toBe(payload.description);
      expect(body.data.status).toBe('OPEN');
      expect(body.data.category).toBe('BUG');
      expect(body.data.priority).toBe('CRITICAL');
      expect(body.data.urgency).toBe('CRITICAL');
      expect(body.data.aiAnalysis).toBeDefined();
      expect(body.data.aiAnalysis.category).toBe('BUG');
      expect(body.data.aiAnalysis.priority).toBe('CRITICAL');
      expect(body.data.aiAnalysis.confidenceScore).toBeGreaterThanOrEqual(0.0);
      expect(body.data.aiAnalysis.confidenceScore).toBeLessThanOrEqual(1.0);
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('returns 400 VALIDATION_ERROR when title is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'ab',
          description: 'Valid length description but title is too short.',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.statusCode).toBe(400);
      expect(body.error.details.length).toBeGreaterThan(0);
      expect(body.error.details[0].field).toBe('title');
    });

    it('returns 400 VALIDATION_ERROR when description is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Valid title here',
          description: 'Too short',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.statusCode).toBe(400);
      expect(body.error.details[0].field).toBe('description');
    });

    it('returns 422 AI_ANALYSIS_FAILED when AI fails to evaluate report', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Trigger failure [SIMULATE_AI_FAILURE]',
          description: 'This issue description deliberately triggers an AI classification failure.',
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AI_ANALYSIS_FAILED');
      expect(body.error.statusCode).toBe(422);
      expect(body.error.message).toBe('The AI classification service failed to evaluate the report text.');
    });
  });

  describe('GET /api/issues', () => {
    beforeEach(async () => {
      // Seed sample issues
      await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Payment gateway timeout',
          description: 'Checkout 504 gateway timeout blocking customer payments in production.',
        },
      });
      await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Dark mode theme request',
          description: 'Please add dark mode option to user settings for night use.',
        },
      });
      await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Vulnerability in auth endpoint',
          description: 'Potential SQL injection vulnerability reported in auth header token parser.',
        },
      });
    });

    it('returns paginated list of issues (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?page=1&limit=2',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data.items.length).toBe(2);
      expect(body.data.pagination.total).toBe(3);
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(2);
      expect(body.data.pagination.totalPages).toBe(2);
      expect(body.data.pagination.hasNextPage).toBe(true);
      expect(body.data.pagination.hasPrevPage).toBe(false);
    });

    it('filters by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?category=FEATURE_REQUEST',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].category).toBe('FEATURE_REQUEST');
    });

    it('filters by priority', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?priority=LOW',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].priority).toBe('LOW');
    });

    it('sorts by priority descending', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?sortBy=priority&sortOrder=desc',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.items.length).toBe(3);
      expect(body.data.items[0].priority).toBe('CRITICAL');
    });

    it('filters by search term', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?search=gateway',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].title).toContain('Payment');
    });

    it('returns 400 INVALID_QUERY_PARAMETER on page < 1', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?page=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_QUERY_PARAMETER');
      expect(body.error.statusCode).toBe(400);
    });

    it('returns 400 INVALID_QUERY_PARAMETER on limit > 100', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?limit=150',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_QUERY_PARAMETER');
      expect(body.error.statusCode).toBe(400);
    });

    it('returns 400 INVALID_QUERY_PARAMETER on invalid category enum', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?category=NON_EXISTENT',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_QUERY_PARAMETER');
      expect(body.error.statusCode).toBe(400);
    });

    it('returns 400 INVALID_QUERY_PARAMETER on invalid priority enum', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?priority=URGENT_NOT_VALID',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_QUERY_PARAMETER');
      expect(body.error.statusCode).toBe(400);
    });
  });

  describe('GET /api/issues/:id', () => {
    it('retrieves an issue by ID (200)', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Memory leak in worker thread',
          description: 'Background worker thread increases heap memory until process out of memory crash.',
        },
      });

      const issueId = JSON.parse(createRes.body).data.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/issues/${issueId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data.id).toBe(issueId);
      expect(body.data.title).toBe('Memory leak in worker thread');
      expect(body.data.priority).toBeDefined();
      expect(body.data.category).toBeDefined();
    });

    it('returns 400 INVALID_ID_FORMAT when ID is not a valid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues/not-a-valid-uuid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_ID_FORMAT');
      expect(body.error.statusCode).toBe(400);
      expect(body.error.message).toBe('The provided issue ID must be a valid UUID.');
    });

    it('returns 404 ISSUE_NOT_FOUND when ID does not exist', async () => {
      const nonExistentId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const response = await app.inject({
        method: 'GET',
        url: `/api/issues/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ISSUE_NOT_FOUND');
      expect(body.error.statusCode).toBe(404);
      expect(body.error.message).toBe(`Issue with ID '${nonExistentId}' was not found.`);
    });
  });

  describe('PATCH /api/issues/:id/status', () => {
    it('updates status of an existing issue to IN_PROGRESS and RESOLVED (200)', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Database connection leak in production pool',
          description: 'Connection pool exhausted under moderate load, causing connection timeouts for clients.',
        },
      });
      const created = JSON.parse(createRes.body).data;

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/api/issues/${created.id}/status`,
        payload: { status: 'IN_PROGRESS' },
      });

      expect(patchRes.statusCode).toBe(200);
      const patchBody = JSON.parse(patchRes.body);
      expect(patchBody.success).toBe(true);
      expect(patchBody.data.id).toBe(created.id);
      expect(patchBody.data.status).toBe('IN_PROGRESS');

      // Update to RESOLVED using alias endpoint
      const aliasRes = await app.inject({
        method: 'PATCH',
        url: `/api/issues/${created.id}`,
        payload: { status: 'RESOLVED' },
      });

      expect(aliasRes.statusCode).toBe(200);
      const aliasBody = JSON.parse(aliasRes.body);
      expect(aliasBody.data.status).toBe('RESOLVED');
    });

    it('returns 400 VALIDATION_ERROR when status value is invalid', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Testing invalid status value payload',
          description: 'Description long enough to pass validation schema checks.',
        },
      });
      const created = JSON.parse(createRes.body).data;

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/api/issues/${created.id}/status`,
        payload: { status: 'INVALID_STATUS' },
      });

      expect(patchRes.statusCode).toBe(400);
      const body = JSON.parse(patchRes.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.statusCode).toBe(400);
    });

    it('returns 400 INVALID_ID_FORMAT when ID is not a valid UUID', async () => {
      const patchRes = await app.inject({
        method: 'PATCH',
        url: '/api/issues/not-a-uuid/status',
        payload: { status: 'CLOSED' },
      });

      expect(patchRes.statusCode).toBe(400);
      const body = JSON.parse(patchRes.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_ID_FORMAT');
    });

    it('returns 404 ISSUE_NOT_FOUND when ID does not exist', async () => {
      const nonExistentId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/api/issues/${nonExistentId}/status`,
        payload: { status: 'RESOLVED' },
      });

      expect(patchRes.statusCode).toBe(404);
      const body = JSON.parse(patchRes.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ISSUE_NOT_FOUND');
    });
  });
});
