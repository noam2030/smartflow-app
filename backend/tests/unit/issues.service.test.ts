import { describe, it, expect, beforeEach } from 'vitest';
import { initializeDatabase } from '../../src/db/database.js';
import { IssuesService } from '../../src/services/issues.service.js';
import { AiAnalysisService } from '../../src/services/ai-analysis.service.js';
import { NotFoundError } from '../../src/errors/app-error.js';
import type { DatabaseSync } from 'node:sqlite';

describe('IssuesService', () => {
  let db: DatabaseSync;
  let service: IssuesService;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    service = new IssuesService(db, new AiAnalysisService());
  });

  it('creates an issue and persists it to SQLite', async () => {
    const created = await service.createIssue({
      title: 'Database connection pool exhausted',
      description: 'The API server runs out of connection handles during spike traffic, returning 500 errors.',
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe('OPEN');
    expect(created.category).toBe('BUG');
    expect(created.priority).toBeDefined();
    expect(created.urgency).toBeDefined();
    expect(created.aiAnalysis).toBeDefined();
    expect(created.aiAnalysis.priority).toBe(created.priority);
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeDefined();

    // Verify it can be retrieved by ID
    const retrieved = await service.getIssueById(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.title).toBe(created.title);
    expect(retrieved.priority).toBe(created.priority);
  });

  it('throws NotFoundError for non-existent issue ID', async () => {
    await expect(service.getIssueById('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundError);
  });

  it('filters issues by category, urgency, and text search', async () => {
    await service.createIssue({
      title: 'Bug report 1',
      description: 'First bug report description with unique-keyword-alpha',
    });
    await service.createIssue({
      title: 'Feature request 1',
      description: 'Please add this new feature to export issues to CSV format.',
    });
    await service.createIssue({
      title: 'Bug report 2',
      description: 'Second bug report description without keyword',
    });

    const searchResult = await service.getIssues({ search: 'unique-keyword-alpha' });
    expect(searchResult.items.length).toBe(1);
    expect(searchResult.pagination.total).toBe(1);

    const bugResult = await service.getIssues({ category: 'BUG' });
    expect(bugResult.items.length).toBe(2);

    const featureResult = await service.getIssues({ category: 'FEATURE_REQUEST' });
    expect(featureResult.items.length).toBe(1);
  });

  it('handles pagination correctly', async () => {
    for (let i = 1; i <= 25; i++) {
      await service.createIssue({
        title: `Issue number ${i}`,
        description: `This is the detailed description for issue report number ${i}.`,
      });
    }

    const page1 = await service.getIssues({ page: 1, limit: 10 });
    expect(page1.items.length).toBe(10);
    expect(page1.pagination.total).toBe(25);
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.limit).toBe(10);
    expect(page1.pagination.totalPages).toBe(3);
    expect(page1.pagination.hasNextPage).toBe(true);
    expect(page1.pagination.hasPrevPage).toBe(false);

    const page2 = await service.getIssues({ page: 2, limit: 10 });
    expect(page2.items.length).toBe(10);
    expect(page2.pagination.hasNextPage).toBe(true);
    expect(page2.pagination.hasPrevPage).toBe(true);

    const page3 = await service.getIssues({ page: 3, limit: 10 });
    expect(page3.items.length).toBe(5);
    expect(page3.pagination.hasNextPage).toBe(false);
    expect(page3.pagination.hasPrevPage).toBe(true);
  });

  it('sorts by title and urgency properly', async () => {
    await service.createIssue({
      title: 'Alpha issue',
      description: 'Minor typo on login page button [cosmetic typo nice to have]',
    });
    await service.createIssue({
      title: 'Zulu issue',
      description: 'Production checkout fails completely unable to purchase emergency down',
    });

    const titleAsc = await service.getIssues({ sortBy: 'title', sortOrder: 'asc' });
    expect(titleAsc.items[0].title).toBe('Alpha issue');
    expect(titleAsc.items[1].title).toBe('Zulu issue');

    const urgencyDesc = await service.getIssues({ sortBy: 'urgency', sortOrder: 'desc' });
    expect(urgencyDesc.items[0].urgency).toBe('CRITICAL');
  });

  it('updates an issue status successfully', async () => {
    const created = await service.createIssue({
      title: 'Task status test',
      description: 'Testing updating status from OPEN to IN_PROGRESS and RESOLVED',
    });

    expect(created.status).toBe('OPEN');

    const inProgress = await service.updateIssueStatus(created.id, 'IN_PROGRESS');
    expect(inProgress.id).toBe(created.id);
    expect(inProgress.status).toBe('IN_PROGRESS');
    expect(new Date(inProgress.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.createdAt).getTime());

    const resolved = await service.updateIssueStatus(created.id, 'RESOLVED');
    expect(resolved.status).toBe('RESOLVED');

    const closed = await service.updateIssueStatus(created.id, 'CLOSED');
    expect(closed.status).toBe('CLOSED');
  });

  it('throws NotFoundError when updating status of non-existent issue', async () => {
    await expect(
      service.updateIssueStatus('00000000-0000-0000-0000-000000000000', 'RESOLVED')
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes an existing issue successfully', async () => {
    const created = await service.createIssue({
      title: 'Issue to be deleted',
      description: 'Temporary issue created to verify deletion logic.',
    });

    const deleteResult = await service.deleteIssue(created.id);
    expect(deleteResult.id).toBe(created.id);
    expect(deleteResult.deleted).toBe(true);

    // Verifying it no longer exists
    await expect(service.getIssueById(created.id)).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when attempting to delete non-existent issue', async () => {
    await expect(
      service.deleteIssue('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow(NotFoundError);
  });
});
