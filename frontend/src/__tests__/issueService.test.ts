import { ApiError, issueService } from '../services/issueService';
import { CreateIssueRequest, Issue } from '../types/issue';

describe('issueService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const mockIssue: Issue = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    title: 'Production checkout fails on credit card submission',
    description: 'When users attempt to submit payment, the request times out after 30 seconds.',
    status: 'OPEN',
    category: 'BUG',
    urgency: 'CRITICAL',
    aiAnalysis: {
      category: 'BUG',
      urgency: 'CRITICAL',
      confidenceScore: 0.98,
      summary: 'Critical payment gateway timeout blocking user checkout.',
      reasoning: 'Direct financial and revenue impact affecting all customers.',
      suggestedAction: 'Alert on-call team to verify payment provider latency.',
    },
    createdAt: '2026-09-09T10:30:00.000Z',
    updatedAt: '2026-09-09T10:30:00.000Z',
  };

  describe('createIssue', () => {
    it('sends POST request to /api/issues and returns created issue', async () => {
      const payload: CreateIssueRequest = {
        title: 'Production checkout fails on credit card submission',
        description: 'When users attempt to submit payment, the request times out after 30 seconds.',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: mockIssue,
        }),
      });

      const result = await issueService.createIssue(payload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledOptions] = (global.fetch as jest.Mock).mock.calls[0];
      expect(calledUrl).toBe('/api/issues');
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(calledOptions.body)).toEqual(payload);
      expect(result).toEqual(mockIssue);
    });

    it('throws ApiError with details when response is 400 Validation Error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload. Title and description are required.',
            statusCode: 400,
            details: [{ field: 'title', message: 'title must be at least 3 characters long' }],
          },
        }),
      });

      await expect(
        issueService.createIssue({ title: 'ab', description: 'short' })
      ).rejects.toThrow(ApiError);

      try {
        await issueService.createIssue({ title: 'ab', description: 'short' });
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiError);
        const error = err as ApiError;
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual([
          { field: 'title', message: 'title must be at least 3 characters long' },
        ]);
      }
    });

    it('throws ApiError when AI analysis fails with 422', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          error: {
            code: 'AI_ANALYSIS_FAILED',
            message: 'The AI classification service failed to evaluate the report text.',
            statusCode: 422,
            details: [],
          },
        }),
      });

      await expect(
        issueService.createIssue({
          title: 'Valid Title Here',
          description: 'Valid description with more than 10 characters',
        })
      ).rejects.toThrow('The AI classification service failed to evaluate the report text.');
    });
  });

  describe('getIssues', () => {
    it('sends GET request to /api/issues with query parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            items: [mockIssue],
            pagination: {
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        }),
      });

      const result = await issueService.getIssues({
        category: 'BUG',
        urgency: 'CRITICAL',
        status: 'OPEN',
        search: 'checkout',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = (global.fetch as jest.Mock).mock.calls[0];
      expect(calledUrl).toContain('/api/issues?');
      expect(calledUrl).toContain('category=BUG');
      expect(calledUrl).toContain('urgency=CRITICAL');
      expect(calledUrl).toContain('status=OPEN');
      expect(calledUrl).toContain('search=checkout');
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=10');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('handles server failure when fetching issues', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred while fetching issues.',
            statusCode: 500,
            details: [],
          },
        }),
      });

      await expect(issueService.getIssues()).rejects.toThrow(ApiError);
    });
  });

  describe('getIssueById', () => {
    it('fetches single issue by ID', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockIssue,
        }),
      });

      const result = await issueService.getIssueById('3fa85f64-5717-4562-b3fc-2c963f66afa6');
      expect(global.fetch).toHaveBeenCalledWith('/api/issues/3fa85f64-5717-4562-b3fc-2c963f66afa6', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      expect(result.id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    });
  });
});
