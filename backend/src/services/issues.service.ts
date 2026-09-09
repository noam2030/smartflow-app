import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type {
  CreateIssueRequest,
  GetIssuesQuery,
  Issue,
  IssueListResponseData,
  PaginationMeta,
} from '../types/issues.js';
import { NotFoundError } from '../errors/app-error.js';
import { AiAnalysisService, type IAiAnalysisService } from './ai-analysis.service.js';

export interface IIssuesService {
  createIssue(data: CreateIssueRequest): Promise<Issue>;
  getIssues(query: GetIssuesQuery): Promise<IssueListResponseData>;
  getIssueById(id: string): Promise<Issue>;
}

interface IssueRow {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  urgency: string;
  priority?: string;
  ai_analysis: string;
  created_at: string;
  updated_at: string;
}

export class IssuesService implements IIssuesService {
  private db: DatabaseSync;
  private aiAnalysisService: IAiAnalysisService;

  constructor(db: DatabaseSync, aiAnalysisService: IAiAnalysisService = new AiAnalysisService()) {
    this.db = db;
    this.aiAnalysisService = aiAnalysisService;
  }

  async createIssue(data: CreateIssueRequest): Promise<Issue> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const aiAnalysis = await this.aiAnalysisService.analyze(data.title, data.description);
    const priority = aiAnalysis.priority || aiAnalysis.urgency;
    const urgency = aiAnalysis.urgency || aiAnalysis.priority;

    const issue: Issue = {
      id,
      title: data.title,
      description: data.description,
      status: 'OPEN',
      category: aiAnalysis.category,
      priority,
      urgency,
      aiAnalysis,
      createdAt: now,
      updatedAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO issues (id, title, description, status, category, urgency, priority, ai_analysis, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      issue.id,
      issue.title,
      issue.description,
      issue.status,
      issue.category,
      issue.urgency,
      issue.priority,
      JSON.stringify(issue.aiAnalysis),
      issue.createdAt,
      issue.updatedAt
    );

    return issue;
  }

  async getIssues(query: GetIssuesQuery): Promise<IssueListResponseData> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }

    if (query.priority) {
      conditions.push('(priority = ? OR urgency = ?)');
      params.push(query.priority, query.priority);
    } else if (query.urgency) {
      conditions.push('(urgency = ? OR priority = ?)');
      params.push(query.urgency, query.urgency);
    }

    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    if (query.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*) as count FROM issues ${whereClause}`;
    const countResult = this.db.prepare(countSql).get(...params) as { count: number };
    const total = countResult ? countResult.count : 0;

    // Sorting
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    let orderByClause: string;

    switch (query.sortBy) {
      case 'title':
        orderByClause = `ORDER BY title ${sortOrder}`;
        break;
      case 'updatedAt':
        orderByClause = `ORDER BY updated_at ${sortOrder}`;
        break;
      case 'priority':
      case 'urgency':
        orderByClause = `ORDER BY CASE COALESCE(priority, urgency)
          WHEN 'CRITICAL' THEN 4
          WHEN 'HIGH' THEN 3
          WHEN 'MEDIUM' THEN 2
          WHEN 'LOW' THEN 1
          ELSE 0 END ${sortOrder}, created_at DESC`;
        break;
      case 'createdAt':
      default:
        orderByClause = `ORDER BY created_at ${sortOrder}`;
        break;
    }

    // Pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const selectSql = `
      SELECT id, title, description, status, category, urgency, priority, ai_analysis, created_at, updated_at
      FROM issues
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(selectSql).all(...params, limit, offset) as unknown as IssueRow[];

    const items: Issue[] = rows.map((row) => this.mapRowToIssue(row));

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1 && total > 0 && page <= totalPages + 1;

    const pagination: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };

    return {
      items,
      pagination,
    };
  }

  async getIssueById(id: string): Promise<Issue> {
    const stmt = this.db.prepare(`
      SELECT id, title, description, status, category, urgency, priority, ai_analysis, created_at, updated_at
      FROM issues
      WHERE id = ?
    `);

    const row = stmt.get(id) as unknown as IssueRow | undefined;

    if (!row) {
      throw new NotFoundError(`Issue with ID '${id}' was not found.`);
    }

    return this.mapRowToIssue(row);
  }

  private mapRowToIssue(row: IssueRow): Issue {
    const aiAnalysis = JSON.parse(row.ai_analysis);
    const priority = (row.priority || row.urgency || aiAnalysis.priority || aiAnalysis.urgency) as any;
    const urgency = (row.urgency || row.priority || aiAnalysis.urgency || aiAnalysis.priority) as any;
    aiAnalysis.priority = priority;
    aiAnalysis.urgency = urgency;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as any,
      category: row.category as any,
      priority,
      urgency,
      aiAnalysis,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
