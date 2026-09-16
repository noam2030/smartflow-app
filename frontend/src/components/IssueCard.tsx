'use client';

import React, { useState } from 'react';
import { Issue, IssueStatus } from '../types/issue';
import { CategoryBadge, ConfidenceBadge, StatusBadge, UrgencyBadge } from './IssueBadge';
import { ChevronDown, ChevronUp, Clock, Lightbulb, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  className?: string;
  onStatusChange?: (issueId: string, newStatus: IssueStatus) => Promise<void>;
  onDelete?: (issueId: string) => Promise<void>;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  className = '',
  onStatusChange,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(issue.id);
    } catch {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as IssueStatus;
    if (newStatus === issue.status || !onStatusChange) return;

    try {
      setIsUpdatingStatus(true);
      await onStatusChange(issue.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
      data-testid={`issue-card-${issue.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <UrgencyBadge urgency={issue.urgency} />
            <CategoryBadge category={issue.category} />
            <StatusBadge status={issue.status} />
            {issue.aiAnalysis?.confidenceScore !== undefined && (
              <ConfidenceBadge score={issue.aiAnalysis.confidenceScore} />
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {issue.title}
          </h3>
        </div>

        <div className="flex flex-row sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-0.5">
          <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>{formatDate(issue.createdAt)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <label
                htmlFor={`status-select-${issue.id}`}
                className="text-xs text-slate-500 dark:text-slate-400 font-medium"
              >
                Status:
              </label>
              <div className="relative inline-flex items-center">
                <select
                  id={`status-select-${issue.id}`}
                  value={issue.status}
                  disabled={isUpdatingStatus || isDeleting}
                  onChange={handleStatusSelect}
                  className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1 pl-2.5 pr-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 appearance-none"
                  data-testid={`status-select-${issue.id}`}
                  aria-label={`Change status for ${issue.title}`}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <div className="pointer-events-none absolute right-1.5 flex items-center">
                  {isUpdatingStatus ? (
                    <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {onDelete && (
              <div className="flex items-center">
                {showConfirmDelete ? (
                  <div className="flex items-center space-x-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-2 py-0.5">
                    <span className="text-xs text-red-700 dark:text-red-300 font-medium mr-1">
                      Delete?
                    </span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteConfirm}
                      data-testid={`confirm-delete-${issue.id}`}
                      className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Yes'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShowConfirmDelete(false)}
                      data-testid={`cancel-delete-${issue.id}`}
                      className="text-xs px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowConfirmDelete(true)}
                    data-testid={`delete-button-${issue.id}`}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete issue"
                    aria-label={`Delete issue ${issue.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-line">
        {issue.description}
      </p>

      {issue.aiAnalysis && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  AI Summary
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-medium">
                  {issue.aiAnalysis.summary}
                </p>
              </div>
            </div>
            {(issue.aiAnalysis.reasoning || issue.aiAnalysis.suggestedAction) && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center ml-2 shrink-0"
                aria-expanded={isExpanded}
                data-testid={`toggle-details-${issue.id}`}
              >
                {isExpanded ? (
                  <>
                    <span>Hide Details</span>
                    <ChevronUp className="w-3.5 h-3.5 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Details</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2.5 text-xs">
              {issue.aiAnalysis.reasoning && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    AI Reasoning:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    {issue.aiAnalysis.reasoning}
                  </p>
                </div>
              )}
              {issue.aiAnalysis.suggestedAction && (
                <div className="flex items-start space-x-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded border border-amber-200 dark:border-amber-900/50">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-semibold">Suggested Remediation:</span>
                    <p className="mt-0.5">{issue.aiAnalysis.suggestedAction}</p>
                  </div>
                </div>
              )}
              <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                ID: <code className="font-mono">{issue.id}</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
