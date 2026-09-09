'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { issueService } from '../services/issueService';
import { ApiError, Issue, IssueQueryParams, PaginationMeta } from '../types/issue';
import { IssueCard } from './IssueCard';
import { IssueFilters } from './IssueFilters';
import { Pagination } from './Pagination';
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  refreshTrigger?: number;
  onNavigateToForm?: () => void;
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  refreshTrigger = 0,
  onNavigateToForm,
  className = '',
}) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [filters, setFilters] = useState<IssueQueryParams>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const fetchIssues = useCallback(async (currentFilters: IssueQueryParams, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await issueService.getIssues(currentFilters);
      setIssues(data.items);
      setPagination(data.pagination);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      } else if (err instanceof Error) {
        setError({ message: err.message });
      } else {
        setError({ message: 'Failed to load issues from server.' });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount or filter changes
  useEffect(() => {
    fetchIssues(filters);
  }, [fetchIssues, filters, refreshTrigger]);

  const handleFilterChange = (updated: Partial<IssueQueryParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
      category: undefined,
      urgency: undefined,
      status: undefined,
      search: undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({ page: newPage });
  };

  // Quick stats computed from current items
  const stats = {
    total: pagination.total,
    open: issues.filter((i) => i.status === 'OPEN').length,
    critical: issues.filter((i) => i.urgency === 'CRITICAL').length,
    bugs: issues.filter((i) => i.category === 'BUG').length,
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="issues-dashboard">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Issues
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.open}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Open (on page)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.critical}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Critical (on page)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.bugs}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Bugs (on page)
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <IssueFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Issues Header & Refresh Control */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Issues List
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {pagination.total}
          </span>
        </div>

        <button
          type="button"
          onClick={() => fetchIssues(filters, true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          data-testid="refresh-issues-button"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4" data-testid="dashboard-loading-skeleton">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-center"
          data-testid="dashboard-error-banner"
          role="alert"
        >
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            {error.code ? `Error: ${error.code}` : 'Failed to Load Issues'}
          </h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1 max-w-md mx-auto">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => fetchIssues(filters)}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            data-testid="retry-fetch-button"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && issues.length === 0 && (
        <div
          className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center"
          data-testid="dashboard-empty-state"
        >
          <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No issues found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {filters.category || filters.urgency || filters.status || filters.search
              ? 'No issues match your active search and filter criteria. Try resetting your filters.'
              : 'There are currently no issues reported. Submit a new issue to get started.'}
          </p>
          <div className="mt-5 flex justify-center items-center space-x-3">
            {filters.category || filters.urgency || filters.status || filters.search ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear Filters
              </button>
            ) : onNavigateToForm ? (
              <button
                type="button"
                onClick={onNavigateToForm}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Report First Issue
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Issues List */}
      {!isLoading && !error && issues.length > 0 && (
        <div className="space-y-4" data-testid="issues-list">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};
