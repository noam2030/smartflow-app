export type IssueCategory =
  | 'BUG'
  | 'FEATURE_REQUEST'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'BILLING'
  | 'GENERAL_INQUIRY';

export type IssueUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface AIAnalysis {
  category: IssueCategory;
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
  urgency: IssueUrgency;
  aiAnalysis: AIAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IssueListResponse {
  success: boolean;
  data: {
    items: Issue[];
    pagination: PaginationMeta;
  };
}

export interface IssueResponse {
  success: boolean;
  data: Issue;
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  details?: ErrorDetail[];
}

export interface ErrorResponse {
  success: false;
  error: ErrorPayload;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: ErrorDetail[];

  constructor(payload: ErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.details = payload.details || [];
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface IssueQueryParams {
  category?: IssueCategory;
  urgency?: IssueUrgency;
  status?: IssueStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'urgency' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
