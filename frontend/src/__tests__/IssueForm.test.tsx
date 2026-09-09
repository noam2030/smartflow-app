import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueForm } from '../components/IssueForm';
import { issueService } from '../services/issueService';
import { ApiError, Issue } from '../types/issue';

jest.mock('../services/issueService');

describe('IssueForm Component', () => {
  const mockCreatedIssue: Issue = {
    id: 'test-uuid-1234',
    title: 'Login button unresponsive',
    description: 'When clicking the login button on mobile Safari, nothing happens.',
    status: 'OPEN',
    category: 'BUG',
    urgency: 'HIGH',
    aiAnalysis: {
      category: 'BUG',
      urgency: 'HIGH',
      confidenceScore: 0.94,
      summary: 'Mobile Safari login interaction failure preventing user authentication.',
      reasoning: 'Blocks authentication flow for iOS users.',
      suggestedAction: 'Check event handler compatibility with iOS touch events.',
    },
    createdAt: '2026-09-09T11:00:00.000Z',
    updatedAt: '2026-09-09T11:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form elements properly', () => {
    render(<IssueForm />);

    expect(screen.getByRole('heading', { name: /report a new issue/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/issue title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/issue description/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-issue-button')).toBeInTheDocument();
  });

  it('shows client-side validation errors when submitting empty inputs', async () => {
    const user = userEvent.setup();
    render(<IssueForm />);

    const submitBtn = screen.getByTestId('submit-issue-button');
    await user.click(submitBtn);

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
    expect(issueService.createIssue).not.toHaveBeenCalled();
  });

  it('validates minimum length requirements for title and description', async () => {
    const user = userEvent.setup();
    render(<IssueForm />);

    const titleInput = screen.getByLabelText(/issue title/i);
    const descInput = screen.getByLabelText(/issue description/i);
    const submitBtn = screen.getByTestId('submit-issue-button');

    await user.type(titleInput, 'ab');
    await user.type(descInput, 'short');
    await user.click(submitBtn);

    expect(await screen.findByText(/title must be at least 3 characters long/i)).toBeInTheDocument();
    expect(await screen.findByText(/description must be at least 10 characters long/i)).toBeInTheDocument();
    expect(issueService.createIssue).not.toHaveBeenCalled();
  });

  it('submits valid inputs to issueService and renders success banner with AI analysis', async () => {
    const user = userEvent.setup();
    const handleSuccess = jest.fn();
    (issueService.createIssue as jest.Mock).mockResolvedValue(mockCreatedIssue);

    render(<IssueForm onSuccess={handleSuccess} />);

    const titleInput = screen.getByLabelText(/issue title/i);
    const descInput = screen.getByLabelText(/issue description/i);
    const submitBtn = screen.getByTestId('submit-issue-button');

    await user.type(titleInput, 'Login button unresponsive');
    await user.type(
      descInput,
      'When clicking the login button on mobile Safari, nothing happens.'
    );
    await user.click(submitBtn);

    await waitFor(() => {
      expect(issueService.createIssue).toHaveBeenCalledWith({
        title: 'Login button unresponsive',
        description: 'When clicking the login button on mobile Safari, nothing happens.',
      });
    });

    expect(handleSuccess).toHaveBeenCalledWith(mockCreatedIssue);

    // Form inputs should be cleared
    expect(titleInput).toHaveValue('');
    expect(descInput).toHaveValue('');

    // Success banner should show AI analysis summary
    expect(await screen.findByTestId('issue-success-banner')).toBeInTheDocument();
    expect(screen.getByText(/Mobile Safari login interaction failure/i)).toBeInTheDocument();
    expect(screen.getByTestId('urgency-badge-high')).toBeInTheDocument();
    expect(screen.getByTestId('category-badge-bug')).toBeInTheDocument();
  });

  it('displays API error alert when creation fails', async () => {
    const user = userEvent.setup();
    (issueService.createIssue as jest.Mock).mockRejectedValue(
      new ApiError({
        code: 'AI_ANALYSIS_FAILED',
        message: 'The AI classification service timed out.',
        statusCode: 422,
        details: [],
      })
    );

    render(<IssueForm />);

    await user.type(screen.getByLabelText(/issue title/i), 'Payment timeout bug');
    await user.type(
      screen.getByLabelText(/issue description/i),
      'Detailed description of payment timeout bug occurring on checkout'
    );
    await user.click(screen.getByTestId('submit-issue-button'));

    expect(await screen.findByTestId('issue-error-banner')).toBeInTheDocument();
    expect(screen.getByText(/The AI classification service timed out./i)).toBeInTheDocument();
  });
});
