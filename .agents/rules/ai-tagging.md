# AI Tagging & Agentic Classification Loop Specification

This document defines the business logic, taxonomy, schema constraints, and self-correcting retry loop for classifying issue reports using Google Gemini in SmartFlow.

---

## 1. Agentic Loop Overview

When a user submits a free-text issue report, it passes through an **Agentic Loop** before being saved to SQLite:

```text
[ Incoming Issue: Title & Description ]
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     AGENTIC TRIAGE LOOP                     │
│                                                             │
│   1. Build Structured Prompt with Taxonomy Rules            │
│   2. Invoke Gemini (with responseMimeType: application/json) │
│   3. Parse & Validate JSON output against Zod Schema        │
│                                                             │
│   ┌───────────────┐       Failed Validation / Invalid JSON   │
│   │ Is JSON Valid?│ ─────────────────────────────────────┐  │
│   └───────┬───────┘                                      │  │
│           │ Success                                      ▼  │
│           │                       ┌──────────────────────┴┐ │
│           │                       │ Attempts < Max (3)?   │ │
│           │                       └───┬───────────────┬───┘ │
│           │                           │ Yes           │ No  │
│           │                           ▼               ▼     │
│           │                  [ Retry with      [ Apply Safe │
│           │                    Error Feedback]   Fallback ] │
└───────────┼───────────────────────────────────────────┬─────┘
            ▼                                           ▼
[ Validated AI Analysis ] ◄─────────────────────────────┘
            │
            ▼
[ Persist Issue & Classification in Database ]
```

---

## 2. Classification Taxonomy

The AI model must strictly classify reports into one of the predefined categories and urgencies:

### Categories (`category`)

| Category | Definition | Example Scenarios |
| :--- | :--- | :--- |
| `BUG` | Defect, application crash, broken logic, or regression. | "Button click triggers 500 error", "Data is missing after save" |
| `FEATURE_REQUEST` | New feature proposal or enhancement to existing capabilities. | "Add dark mode", "Allow exporting issues to CSV" |
| `PERFORMANCE` | Latency, timeouts, high memory usage, or sluggish rendering. | "Issue list takes 8 seconds to load", "CPU spikes to 100%" |
| `SECURITY` | Vulnerability, authorization bypass, credential leak, injection. | "Unauthenticated access to user profile", "SQL injection flaw" |
| `BILLING` | Subscription, payments, credit cards, or invoices. | "Charged twice for subscription", "Credit card failed" |
| `GENERAL_INQUIRY` | Questions, feedback, or ambiguous reports that lack specific details. | "How do I invite teammates?", "Is there an API available?" |

### Urgency Levels (`urgency`)

| Urgency | Criteria | Target Response |
| :--- | :--- | :--- |
| `CRITICAL` | Complete system outage, data loss, security compromise, or blocking all customer payments. | Immediate escalation |
| `HIGH` | Core workflow broken for multiple users with no reasonable workaround. | Fast resolution |
| `MEDIUM` | Non-blocking bug or performance defect with an existing workaround. | Standard sprint queue |
| `LOW` | Cosmetic flaw, typo, minor visual glitch, or non-urgent suggestion. | Backlog triage |

---

## 3. Schema & Type Definition

The AI output must conform strictly to the following schema:

```typescript
import { z } from 'zod';

export const AIAnalysisSchema = z.object({
  category: z.enum([
    'BUG',
    'FEATURE_REQUEST',
    'PERFORMANCE',
    'SECURITY',
    'BILLING',
    'GENERAL_INQUIRY'
  ]),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  confidenceScore: z.number().min(0.0).max(1.0),
  summary: z.string().min(5).max(300),
  reasoning: z.string().min(10).max(500),
  suggestedAction: z.string().min(5).max(300)
});

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;
```

---

## 4. Prompt Engineering Standard

- Use Gemini's system instructions to enforce JSON output.
- Request explicit rationale for both category and urgency to enhance reasoning accuracy.
- **System Prompt Template:**
  ```text
  You are an expert software support and triage engineer.
  Analyze the provided issue title and description and output a JSON object classifying its category and urgency.
  
  Taxonomy Rules:
  - category: one of ["BUG", "FEATURE_REQUEST", "PERFORMANCE", "SECURITY", "BILLING", "GENERAL_INQUIRY"]
  - urgency: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
  - confidenceScore: float between 0.0 and 1.0
  - summary: single concise summary sentence
  - reasoning: clear justification for the chosen category and urgency
  - suggestedAction: actionable next step for the engineering team
  
  Output raw JSON only matching the schema. No markdown backticks, no explanatory text.
  ```

---

## 5. Validation and Retry Mechanism

To guarantee database integrity, never write unvalidated AI responses to SQLite.

### Retry Loop Specifications

1. **Max Retries**: 3 attempts total.
2. **Backoff**: Exponential backoff (attempt 1: 500ms, attempt 2: 1000ms, attempt 3: 2000ms).
3. **Error Feedback Injection**:
   If Gemini returns unparseable JSON or violates the Zod schema, the subsequent prompt includes the validation error message:
   ```text
   Your previous response was rejected due to the following validation error:
   [ZodError / JSON parse failure: details]
   
   Please correct the error and return ONLY valid JSON matching the exact schema.
   ```

### Safe Fallback Mechanism

If all 3 retry attempts fail (due to API downtime, rate limits, or persistent malformed outputs):
- **Do NOT drop the user's issue report.**
- Assign the deterministic fallback classification:
  ```json
  {
    "category": "GENERAL_INQUIRY",
    "urgency": "MEDIUM",
    "confidenceScore": 0.0,
    "summary": "Auto-generated: AI classification unavailable at time of submission.",
    "reasoning": "AI triage loop failed after 3 retry attempts. Queued for manual triage.",
    "suggestedAction": "Manually triage issue category and urgency."
  }
  ```
- Log a warning with structured error diagnostics for operational monitoring.
- Persist the issue with the fallback analysis so that the report is safely preserved in the database.
