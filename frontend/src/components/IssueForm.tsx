'use client';

import React, { useState } from 'react';
import { issueService } from '../services/issueService';
import { ApiError, Issue } from '../types/issue';
import { CategoryBadge, ConfidenceBadge, UrgencyBadge } from './IssueBadge';
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface IssueFormProps {
  onSuccess?: (newIssue: Issue) => void;
  className?: string;
}

export const IssueForm: React.FC<IssueFormProps> = ({ onSuccess, className = '' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [apiError, setApiError] = useState<{
    message: string;
    code?: string;
    details?: Array<{ field?: string; message: string }>;
  } | null>(null);
  const [lastCreatedIssue, setLastCreatedIssue] = useState<Issue | null>(null);

  const validate = (): boolean => {
    const errors: { title?: string; description?: string } = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Title is required';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Description is required';
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdIssue = await issueService.createIssue({
        title: title.trim(),
        description: description.trim(),
      });

      setLastCreatedIssue(createdIssue);
      setTitle('');
      setDescription('');
      setValidationErrors({});

      if (onSuccess) {
        onSuccess(createdIssue);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError({
          message: err.message,
          code: err.code,
          details: err.details,
        });
      } else if (err instanceof Error) {
        setApiError({ message: err.message });
      } else {
        setApiError({ message: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setValidationErrors({});
    setApiError(null);
    setLastCreatedIssue(null);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8 ${className}`}
      data-testid="issue-reporting-form"
    >
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Report a New Issue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit an issue report. Our AI engine will automatically classify category, urgency, and recommended actions.
          </p>
        </div>
      </div>

      {lastCreatedIssue && (
        <div
          className="mb-6 p-5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg"
          data-testid="issue-success-banner"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                Issue Reported and Analyzed Successfully!
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 mb-3">
                &ldquo;{lastCreatedIssue.title}&rdquo; was processed with AI classification.
              </p>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={lastCreatedIssue.category} />
                  <UrgencyBadge urgency={lastCreatedIssue.urgency} />
                  <ConfidenceBadge score={lastCreatedIssue.aiAnalysis.confidenceScore} />
                </div>
                {lastCreatedIssue.aiAnalysis.summary && (
                  <p className="text-slate-700 dark:text-slate-300 text-xs italic">
                    &ldquo;{lastCreatedIssue.aiAnalysis.summary}&rdquo;
                  </p>
                )}
                {lastCreatedIssue.aiAnalysis.suggestedAction && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Suggested Action:
                    </span>{' '}
                    {lastCreatedIssue.aiAnalysis.suggestedAction}
                  </p>
                )}
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 underline"
                >
                  Dismiss banner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <div
          className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"
          data-testid="issue-error-banner"
          role="alert"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-red-800 dark:text-red-200">
                {apiError.code ? `Error: ${apiError.code}` : 'Submission Failed'}
              </div>
              <p className="text-red-700 dark:text-red-300 mt-1">{apiError.message}</p>
              {apiError.details && apiError.details.length > 0 && (
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
                  {apiError.details.map((detail, idx) => (
                    <li key={idx}>
                      {detail.field ? <span className="font-medium">{detail.field}: </span> : null}
                      {detail.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="issue-title"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Issue Title <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-xs ${
                  title.length > 200
                    ? 'text-red-600 font-semibold'
                    : title.length >= 3
                    ? 'text-slate-400'
                    : 'text-amber-600'
                }`}
              >
                {title.length}/200 chars (min 3)
              </span>
            </div>
            <input
              id="issue-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="e.g., Production checkout fails on credit card submission"
              className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                validationErrors.title
                  ? 'border-red-400 bg-red-50/30 text-red-900 focus:ring-red-300'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-900'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-invalid={!!validationErrors.title}
              aria-describedby={validationErrors.title ? 'title-error' : undefined}
            />
            {validationErrors.title && (
              <p id="title-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {validationErrors.title}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="issue-description"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Issue Description <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-xs ${
                  description.length >= 10 ? 'text-slate-400' : 'text-amber-600'
                }`}
              >
                {description.length} chars (min 10)
              </span>
            </div>
            <textarea
              id="issue-description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationErrors.description) {
                  setValidationErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="Detailed description of the issue, steps to reproduce, errors encountered, or impact..."
              className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                validationErrors.description
                  ? 'border-red-400 bg-red-50/30 text-red-900 focus:ring-red-300'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-900'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-invalid={!!validationErrors.description}
              aria-describedby={validationErrors.description ? 'description-error' : undefined}
            />
            {validationErrors.description && (
              <p
                id="description-error"
                className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium"
              >
                {validationErrors.description}
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting || (!title && !description)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all"
              data-testid="submit-issue-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing & Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Issue
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
