import { describe, it, expect } from 'vitest';
import { AiAnalysisService } from '../../src/services/ai-analysis.service.js';
import { AiAnalysisError } from '../../src/errors/app-error.js';

describe('AiAnalysisService', () => {
  const service = new AiAnalysisService();

  it('classifies a critical production bug correctly', async () => {
    const analysis = await service.analyze(
      'Production checkout fails on credit card submission',
      'When users attempt to submit payment on the checkout page, the request times out after 30 seconds and returns a 504 gateway timeout. Customers are completely unable to complete purchases.'
    );

    expect(analysis.category).toBe('BUG');
    expect(analysis.priority).toBe('CRITICAL');
    expect(analysis.urgency).toBe('CRITICAL');
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0.0);
    expect(analysis.confidenceScore).toBeLessThanOrEqual(1.0);
    expect(analysis.summary).toBeTruthy();
    expect(analysis.reasoning).toBeTruthy();
    expect(analysis.suggestedAction).toBeTruthy();
  });

  it('classifies a security vulnerability as high/critical urgency and priority', async () => {
    const analysis = await service.analyze(
      'SQL injection vulnerability in user profile endpoint',
      'An unauthenticated attacker can exploit parameter sanitization flaw to leak database credentials.'
    );

    expect(analysis.category).toBe('SECURITY');
    expect(['HIGH', 'CRITICAL']).toContain(analysis.priority);
    expect(['HIGH', 'CRITICAL']).toContain(analysis.urgency);
    expect(analysis.confidenceScore).toBeGreaterThan(0.5);
  });

  it('classifies billing inquiries properly', async () => {
    const analysis = await service.analyze(
      'Incorrect subscription invoice charge',
      'Customer was billed twice for the enterprise plan monthly renewal invoice.'
    );

    expect(analysis.category).toBe('BILLING');
    expect(analysis.priority).toBe('MEDIUM');
    expect(analysis.urgency).toBe('MEDIUM');
  });

  it('classifies performance issues properly', async () => {
    const analysis = await service.analyze(
      'High latency and CPU spikes on search API',
      'The search endpoint shows 2000ms latency and high memory usage during peak hours.'
    );

    expect(analysis.category).toBe('PERFORMANCE');
    expect(['MEDIUM', 'HIGH']).toContain(analysis.priority);
    expect(['MEDIUM', 'HIGH']).toContain(analysis.urgency);
  });

  it('classifies feature requests with low priority and urgency', async () => {
    const analysis = await service.analyze(
      'Feature request: Dark mode support',
      'It would be great to add dark mode theme option in the user profile settings.'
    );

    expect(analysis.category).toBe('FEATURE_REQUEST');
    expect(analysis.priority).toBe('LOW');
    expect(analysis.urgency).toBe('LOW');
  });

  it('classifies general inquiries with low priority and urgency', async () => {
    const analysis = await service.analyze(
      'Question regarding API documentation',
      'Where can I find the documentation guide for setting up webhook notifications?'
    );

    expect(analysis.category).toBe('GENERAL_INQUIRY');
    expect(analysis.priority).toBe('LOW');
    expect(analysis.urgency).toBe('LOW');
  });

  it('throws AiAnalysisError when simulation trigger is passed', async () => {
    await expect(
      service.analyze(
        'Simulate failure [SIMULATE_AI_FAILURE]',
        'This issue text is engineered to fail AI classification.'
      )
    ).rejects.toThrow(AiAnalysisError);
  });

  it('classifies issue successfully using external Gemini AI model', async () => {
    const mockGeminiClient: any = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            category: 'PERFORMANCE',
            priority: 'HIGH',
            confidenceScore: 0.96,
            summary: 'External AI: API latency spike under heavy query load.',
            reasoning: 'External AI reasoning: response time exceeds SLA threshold.',
            suggestedAction: 'Scale up container instances and optimize slow database queries.',
          }),
        }),
      },
    };

    const externalService = new AiAnalysisService(mockGeminiClient);
    const analysis = await externalService.analyze(
      'API latency spike',
      'Average response time exceeds 2500ms on reports endpoint.'
    );

    expect(analysis.category).toBe('PERFORMANCE');
    expect(analysis.priority).toBe('HIGH');
    expect(analysis.urgency).toBe('HIGH');
    expect(analysis.confidenceScore).toBe(0.96);
    expect(analysis.summary).toContain('External AI');
    expect(analysis.reasoning).toContain('External AI reasoning');
    expect(analysis.suggestedAction).toContain('Scale up');
  });

  it('handles external AI model failure with fallback', async () => {
    const mockFailingGeminiClient: any = {
      models: {
        generateContent: async () => {
          throw new Error('Network timeout connecting to Gemini API');
        },
      },
    };

    const externalService = new AiAnalysisService(mockFailingGeminiClient);
    // When fallback is enabled (default), it gracefully falls back to heuristic analysis
    const analysis = await externalService.analyze(
      'Production outage: servers down',
      'All servers are crashing and users are completely unable to access the app.'
    );

    expect(analysis.category).toBe('BUG');
    expect(analysis.priority).toBe('CRITICAL');
  });
});
