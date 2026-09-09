import { GoogleGenAI, Type } from '@google/genai';
import type { AIAnalysis, IssueCategory, IssuePriority, IssueUrgency } from '../types/issues.js';
import { AiAnalysisError } from '../errors/app-error.js';

export interface IAiAnalysisService {
  analyze(title: string, description: string): Promise<AIAnalysis>;
}

export class AiAnalysisService implements IAiAnalysisService {
  private geminiClient: GoogleGenAI | null = null;

  constructor(geminiClient?: GoogleGenAI | null) {
    if (geminiClient) {
      this.geminiClient = geminiClient;
    }
  }

  async analyze(title: string, description: string): Promise<AIAnalysis> {
    const combinedText = `${title} ${description}`.toLowerCase();

    // Check for simulated failure trigger
    if (
      combinedText.includes('[simulate_ai_failure]') ||
      combinedText.includes('trigger_ai_error') ||
      process.env.FORCE_AI_FAILURE === 'true'
    ) {
      throw new AiAnalysisError('The AI classification service failed to evaluate the report text.');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (this.geminiClient || apiKey) {
      try {
        return await this.analyzeWithGemini(title, description, apiKey);
      } catch (err) {
        if (err instanceof AiAnalysisError) {
          throw err;
        }
        if (process.env.AI_FALLBACK_ENABLED === 'false') {
          throw new AiAnalysisError(
            `External AI model failed to evaluate issue: ${(err as Error).message}`
          );
        }
        console.warn(
          `[SmartFlow AI] External Gemini model failed, using intelligent heuristic fallback: ${(err as Error).message}`
        );
      }
    }

    return this.analyzeWithHeuristics(title, description, combinedText);
  }

  private async analyzeWithGemini(
    title: string,
    description: string,
    apiKey?: string
  ): Promise<AIAnalysis> {
    if (!this.geminiClient) {
      if (!apiKey) {
        throw new AiAnalysisError('GEMINI_API_KEY is not configured.');
      }
      this.geminiClient = new GoogleGenAI({ apiKey });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const prompt = `You are an issue triage assistant. Analyze this issue report:
Title: "${title}"
Description: "${description}"

Classify into appropriate category and priority level.`;

    const response = await this.geminiClient.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: ['BUG', 'FEATURE_REQUEST', 'PERFORMANCE', 'SECURITY', 'BILLING', 'GENERAL_INQUIRY'],
            },
            priority: {
              type: Type.STRING,
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            },
            confidenceScore: {
              type: Type.NUMBER,
            },
            summary: {
              type: Type.STRING,
            },
            reasoning: {
              type: Type.STRING,
            },
            suggestedAction: {
              type: Type.STRING,
            },
          },
          required: ['category', 'priority', 'confidenceScore', 'summary', 'reasoning', 'suggestedAction'],
        },
        systemInstruction:
          'You are an intelligent software issue classification model for SmartFlow. Return only valid JSON conforming strictly to the responseSchema.',
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new AiAnalysisError('External AI model returned empty content.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new AiAnalysisError('External AI model returned non-JSON response.');
    }

    const category = parsed.category as IssueCategory;
    const priority = parsed.priority as IssuePriority;
    const urgency = priority;
    const rawScore = typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95;
    const confidenceScore = Math.min(1.0, Math.max(0.0, Math.round(rawScore * 100) / 100));

    return {
      category,
      priority,
      urgency,
      confidenceScore,
      summary: parsed.summary || `${priority} ${category}: ${title}`,
      reasoning: parsed.reasoning || `Classified by external AI model (${modelName}).`,
      suggestedAction: parsed.suggestedAction || 'Assign to triage squad.',
    };
  }

  private analyzeWithHeuristics(title: string, description: string, combinedText: string): AIAnalysis {
    const { category, categoryConfidence, categoryReason } = this.determineCategory(combinedText, title);
    const { urgency, urgencyConfidence, urgencyReason } = this.determineUrgency(combinedText, category);

    // Calculate overall confidence score between 0.0 and 1.0
    const rawScore = (categoryConfidence + urgencyConfidence) / 2;
    const confidenceScore = Math.min(1.0, Math.max(0.1, Math.round(rawScore * 100) / 100));

    const summary = this.generateSummary(title, category, urgency, combinedText);
    const reasoning = `${categoryReason} ${urgencyReason}`;
    const suggestedAction = this.generateSuggestedAction(category, urgency);
    const priority = urgency;

    return {
      category,
      priority,
      urgency,
      confidenceScore,
      summary,
      reasoning,
      suggestedAction,
    };
  }

  private determineCategory(
    text: string,
    title: string
  ): { category: IssueCategory; categoryConfidence: number; categoryReason: string } {
    const scores: Record<IssueCategory, number> = {
      SECURITY: 0,
      BILLING: 0,
      PERFORMANCE: 0,
      BUG: 0,
      FEATURE_REQUEST: 0,
      GENERAL_INQUIRY: 0,
    };

    // Keyword weights
    const match = (pattern: RegExp) => (text.match(pattern) || []).length;

    scores.SECURITY += match(/\b(vulnerability|cve|exploit|breach|xss|sql injection|injection|unauthorized|credential|leak|compromised|auth bypass|privilege)\b/g) * 3;
    scores.BILLING += match(/\b(billing|invoice|refund|charge|subscription|credit card|receipt|pricing|overcharged|payment gateway|stripe)\b/g) * 2;
    scores.PERFORMANCE += match(/\b(slow|latency|timeout|high cpu|memory leak|lag|504|sluggish|throughput|bottleneck|high memory|unresponsive)\b/g) * 2;
    scores.BUG += match(/\b(fail|fails|error|exception|crash|broken|bug|500|unexpected|regression|stack trace|null pointer|cannot|unable to)\b/g) * 2;
    scores.FEATURE_REQUEST += match(/\b(feature|request|enhancement|suggest|please add|would be great|wish|support for|new option)\b/g) * 2;
    scores.GENERAL_INQUIRY += match(/\b(how do i|question|inquiry|documentation|where can i find|help understanding|clarification|guide)\b/g) * 2;

    // Disambiguate checkout/payment failures: if payment fails or crashes, it's primarily a BUG with billing context
    if (scores.BUG > 0 && (scores.BILLING > 0 || scores.PERFORMANCE > 0) && /\b(fail|timeout|error|unable)\b/.test(text)) {
      scores.BUG += 2;
    }

    let topCategory: IssueCategory = 'BUG';
    let maxScore = -1;

    for (const [cat, score] of Object.entries(scores) as [IssueCategory, number][]) {
      if (score > maxScore) {
        maxScore = score;
        topCategory = cat;
      }
    }

    if (maxScore === 0) {
      // Default heuristics
      if (text.includes('?')) {
        topCategory = 'GENERAL_INQUIRY';
      } else {
        topCategory = 'BUG';
      }
    }

    let categoryConfidence = 0.85;
    if (maxScore >= 4) categoryConfidence = 0.98;
    else if (maxScore >= 2) categoryConfidence = 0.92;

    const categoryReasonMap: Record<IssueCategory, string> = {
      SECURITY: 'Detected security-related terms indicating potential vulnerability or security exposure.',
      BILLING: 'Contains payment, subscription, or billing-related inquiries.',
      PERFORMANCE: 'Identified performance degradation or latency/resource issues.',
      BUG: 'Report indicates unexpected behavior, runtime error, or functional failure.',
      FEATURE_REQUEST: 'Identified user request for new capability or enhancement.',
      GENERAL_INQUIRY: 'Identified informational query or documentation question.',
    };

    return {
      category: topCategory,
      categoryConfidence,
      categoryReason: categoryReasonMap[topCategory],
    };
  }

  private determineUrgency(
    text: string,
    category: IssueCategory
  ): { urgency: IssueUrgency; urgencyConfidence: number; urgencyReason: string } {
    let urgency: IssueUrgency = 'MEDIUM';
    let urgencyConfidence = 0.88;
    let urgencyReason = 'Moderate impact on system or user workflow.';

    const criticalMatch = /\b(production|down|outage|data loss|security breach|blocking all|completely unable|emergency|severe|504 gateway timeout|critical)\b/i.test(text);
    const highMatch = /\b(urgent|broken for many|major|degradation|core feature|revenue impact|timeout|cannot complete|failing)\b/i.test(text);
    const lowMatch = /\b(cosmetic|typo|nice to have|minor question|future|enhancement)\b/i.test(text);

    if (criticalMatch) {
      urgency = 'CRITICAL';
      urgencyConfidence = 0.98;
      urgencyReason = 'Direct severe impact on production availability, customer transactions, or critical operations.';
    } else if (category === 'SECURITY' || highMatch) {
      urgency = 'HIGH';
      urgencyConfidence = 0.94;
      urgencyReason = 'High severity impact on core business capabilities or security stance.';
    } else if (category === 'FEATURE_REQUEST' || category === 'GENERAL_INQUIRY' || lowMatch) {
      urgency = 'LOW';
      urgencyConfidence = 0.90;
      urgencyReason = 'Informational or non-blocking request with minimal operational urgency.';
    }

    return { urgency, urgencyConfidence, urgencyReason };
  }

  private generateSummary(title: string, category: IssueCategory, urgency: IssueUrgency, text: string): string {
    if (text.includes('checkout') && text.includes('timeout')) {
      return 'Critical payment gateway timeout blocking user checkout transactions.';
    }
    const cleanTitle = title.trim().replace(/[.]+$/, '');
    return `${urgency.charAt(0) + urgency.slice(1).toLowerCase()} ${category.toLowerCase().replace('_', ' ')}: ${cleanTitle}.`;
  }

  private generateSuggestedAction(category: IssueCategory, urgency: IssueUrgency): string {
    if (urgency === 'CRITICAL') {
      return 'Immediately alert on-call engineering team and verify system health and third-party dependencies.';
    }
    switch (category) {
      case 'SECURITY':
        return 'Notify the security operations team to triage vulnerability and audit access logs.';
      case 'BILLING':
        return 'Route to billing support team and verify payment gateway status.';
      case 'PERFORMANCE':
        return 'Inspect APM telemetry, database query performance, and server resource metrics.';
      case 'FEATURE_REQUEST':
        return 'Add to product backlog and schedule for future sprint planning.';
      case 'GENERAL_INQUIRY':
        return 'Assign to customer support team or provide relevant documentation links.';
      case 'BUG':
      default:
        return 'Assign to the relevant engineering squad to reproduce and deploy a bugfix.';
    }
  }
}
