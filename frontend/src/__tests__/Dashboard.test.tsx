import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../components/Dashboard';
import { issueService } from '../services/issueService';
import { Issue } from '../types/issue';

jest.mock('../services/issueService');

describe('Dashboard Component', () => {
  const mockIssues: Issue[] = [
    {
      id: 'issue-1',
      title: 'Production checkout fails on credit card submission',
      description: 'When users attempt to submit payment on checkout page, request times out.',
      status: 'OPEN',
      category: 'BUG',
      urgency: 'CRITICAL',
      aiAnalysis: {
        category: 'BUG',
        urgency: 'CRITICAL',
        confidenceScore: 0.98,
        summary: 'Critical payment gateway timeout blocking user checkout.',
        reasoning: 'Direct revenue impact.',
        suggestedAction: 'Alert on-call engineering team.',
      },
      createdAt: '2026-09-09T10:30:00.000Z',
      updatedAt: '2026-09-09T10:30:00.000Z',
    },
    {
      id: 'issue-2',
      title: 'Add dark mode theme support',
      description: 'Users have requested a dark mode option to reduce eye strain at night.',
      status: 'IN_PROGRESS',
      category: 'FEATURE_REQUEST',
      urgency: 'LOW',
      aiAnalysis: {
        category: 'FEATURE_REQUEST',
        urgency: 'LOW',
        confidenceScore: 0.88,
        summary: 'Feature request for application dark mode theme.',
        reasoning: 'Non-blocking UX enhancement.',
        suggestedAction: 'Prioritize in upcoming design sprint.',
      },
      createdAt: '2026-09-08T09:15:00.000Z',
      updatedAt: '2026-09-08T09:15:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially and then displays issues', async () => {
    (issueService.getIssues as jest.Mock).mockResolvedValue({
      items: mockIssues,
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(<Dashboard />);

    expect(screen.getByTestId('dashboard-loading-skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Production checkout fails on credit card submission')).toBeInTheDocument();
    expect(screen.getByText('Add dark mode theme support')).toBeInTheDocument();
    expect(screen.getByTestId('urgency-badge-critical')).toBeInTheDocument();
    expect(screen.getByTestId('category-badge-bug')).toBeInTheDocument();
  });

  it('renders empty state when no issues exist', async () => {
    (issueService.getIssues as jest.Mock).mockResolvedValue({
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/no issues found/i)).toBeInTheDocument();
  });

  it('handles error state and provides retry button', async () => {
    const user = userEvent.setup();
    (issueService.getIssues as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to connect to server')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to connect to server/i)).toBeInTheDocument();

    // Now let retry succeed
    (issueService.getIssues as jest.Mock).mockResolvedValueOnce({
      items: mockIssues,
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    const retryBtn = screen.getByTestId('retry-fetch-button');
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Production checkout fails on credit card submission')).toBeInTheDocument();
    });
  });

  it('allows expanding AI details on issue card', async () => {
    const user = userEvent.setup();
    (issueService.getIssues as jest.Mock).mockResolvedValue({
      items: [mockIssues[0]],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Production checkout fails on credit card submission')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTestId('toggle-details-issue-1');
    await user.click(toggleBtn);

    expect(screen.getByText(/Direct revenue impact./i)).toBeInTheDocument();
    expect(screen.getByText(/Alert on-call engineering team./i)).toBeInTheDocument();
  });
});
