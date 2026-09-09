export type IssueCategory =
  | 'BUG'
  | 'FEATURE_REQUEST'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'BILLING'
  | 'GENERAL_INQUIRY';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueUrgency = IssuePriority;

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface AIAnalysis {
  category: IssueCategory;
  priority: IssuePriority;
  urgency: IssueUrgency;
  confidenceScore: number;
  summary: string;
  reasoning?: string;
  suggestedAction?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  category: IssueCategory;
  priority: IssuePriority;
  urgency: IssueUrgency;
  aiAnalysis: AIAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
}

export interface UpdateIssueStatusRequest {
  status: IssueStatus;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IssueListResponseData {
  items: Issue[];
  pagination: PaginationMeta;
}

export interface GetIssuesQuery {
  category?: IssueCategory;
  priority?: IssuePriority;
  urgency?: IssueUrgency;
  status?: IssueStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'urgency' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  details: ErrorDetail[];
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: ErrorPayload;
}
