'use client';

import React from 'react';
import {
  IssueCategory,
  IssueQueryParams,
  IssueStatus,
  IssueUrgency,
} from '../types/issue';
import { RotateCcw, Search } from 'lucide-react';

interface IssueFiltersProps {
  filters: IssueQueryParams;
  onChange: (updatedFilters: Partial<IssueQueryParams>) => void;
  onReset: () => void;
  className?: string;
}

const CATEGORIES: Array<{ value: IssueCategory; label: string }> = [
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry' },
];

const URGENCIES: Array<{ value: IssueUrgency; label: string }> = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUSES: Array<{ value: IssueStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export const IssueFilters: React.FC<IssueFiltersProps> = ({
  filters,
  onChange,
  onReset,
  className = '',
}) => {
  const hasActiveFilters = Boolean(
    filters.category ||
      filters.urgency ||
      filters.status ||
      filters.search ||
      (filters.sortBy && filters.sortBy !== 'createdAt') ||
      (filters.sortOrder && filters.sortOrder !== 'desc')
  );

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 ${className}`}
      data-testid="issue-filters"
    >
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search issues by title or description..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="filter-search-input"
          />
        </div>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            data-testid="reset-filters-button"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Select Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Category Filter */}
        <div>
          <label
            htmlFor="filter-category"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category || ''}
            onChange={(e) =>
              onChange({
                category: (e.target.value || undefined) as IssueCategory | undefined,
                page: 1,
              })
            }
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="filter-category-select"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Urgency Filter */}
        <div>
          <label
            htmlFor="filter-urgency"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
          >
            Urgency
          </label>
          <select
            id="filter-urgency"
            value={filters.urgency || ''}
            onChange={(e) =>
              onChange({
                urgency: (e.target.value || undefined) as IssueUrgency | undefined,
                page: 1,
              })
            }
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="filter-urgency-select"
          >
            <option value="">All Urgencies</option>
            {URGENCIES.map((urg) => (
              <option key={urg.value} value={urg.value}>
                {urg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="filter-status"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status || ''}
            onChange={(e) =>
              onChange({
                status: (e.target.value || undefined) as IssueStatus | undefined,
                page: 1,
              })
            }
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="filter-status-select"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By & Order */}
        <div>
          <label
            htmlFor="filter-sort"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
          >
            Sort By
          </label>
          <div className="flex space-x-1.5">
            <select
              id="filter-sort"
              value={filters.sortBy || 'createdAt'}
              onChange={(e) =>
                onChange({
                  sortBy: e.target.value as 'createdAt' | 'updatedAt' | 'urgency' | 'title',
                })
              }
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="filter-sort-by-select"
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Date Updated</option>
              <option value="urgency">Urgency</option>
              <option value="title">Title</option>
            </select>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) =>
                onChange({
                  sortOrder: e.target.value as 'asc' | 'desc',
                })
              }
              className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="filter-sort-order-select"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
