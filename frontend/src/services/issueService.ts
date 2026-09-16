import {
  ApiError,
  CreateIssueRequest,
  ErrorResponse,
  Issue,
  IssueListResponse,
  IssueQueryParams,
  IssueResponse,
  IssueStatus,
  PaginationMeta,
} from '../types/issue';

export { ApiError };

const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return '';
};

export const issueService = {
  /**
   * Submit a new issue report for AI classification and storage.
   * Sends a POST request to /api/issues.
   */
  async createIssue(payload: CreateIssueRequest): Promise<Issue> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/issues`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && 'error' in data) {
        const errorRes = data as ErrorResponse;
        throw new ApiError(errorRes.error);
      }
      throw new ApiError({
        code: 'HTTP_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
        statusCode: response.status,
      });
    }

    const issueResponse = data as IssueResponse;
    return issueResponse.data;
  },

  /**
   * Fetch paginated list of issues with filtering and sorting.
   * Sends a GET request to /api/issues.
   */
  async getIssues(params: IssueQueryParams = {}): Promise<{
    items: Issue[];
    pagination: PaginationMeta;
  }> {
    const baseUrl = getApiBaseUrl();
    const searchParams = new URLSearchParams();

    if (params.category) searchParams.append('category', params.category);
    if (params.urgency) searchParams.append('urgency', params.urgency);
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = `${baseUrl}/api/issues${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && 'error' in data) {
        const errorRes = data as ErrorResponse;
        throw new ApiError(errorRes.error);
      }
      throw new ApiError({
        code: 'HTTP_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
        statusCode: response.status,
      });
    }

    const issueListResponse = data as IssueListResponse;
    return issueListResponse.data;
  },

  /**
   * Retrieve a specific issue by ID.
   * Sends a GET request to /api/issues/:id.
   */
  async getIssueById(id: string): Promise<Issue> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/issues/${encodeURIComponent(id)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && 'error' in data) {
        const errorRes = data as ErrorResponse;
        throw new ApiError(errorRes.error);
      }
      throw new ApiError({
        code: 'HTTP_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
        statusCode: response.status,
      });
    }

    const issueResponse = data as IssueResponse;
    return issueResponse.data;
  },

  /**
   * Update the status of an issue.
   * Sends a PATCH request to /api/issues/:id/status.
   */
  async updateIssueStatus(id: string, status: IssueStatus): Promise<Issue> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/issues/${encodeURIComponent(id)}/status`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && 'error' in data) {
        const errorRes = data as ErrorResponse;
        throw new ApiError(errorRes.error);
      }
      throw new ApiError({
        code: 'HTTP_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
        statusCode: response.status,
      });
    }

    const issueResponse = data as IssueResponse;
    return issueResponse.data;
  },

  /**
   * Delete an issue by ID.
   * Sends a DELETE request to /api/issues/:id.
   */
  async deleteIssue(id: string): Promise<{ id: string; deleted: boolean }> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/issues/${encodeURIComponent(id)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && 'error' in data) {
        const errorRes = data as ErrorResponse;
        throw new ApiError(errorRes.error);
      }
      throw new ApiError({
        code: 'HTTP_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
        statusCode: response.status,
      });
    }

    return data.data;
  },
};
