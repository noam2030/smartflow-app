# Testing Guidelines

This document establishes the testing standards, frameworks, execution workflows, and best practices for unit, integration, and end-to-end (E2E) testing across the SmartFlow project.

---

## 1. Testing Strategy & Pyramid

SmartFlow enforces a multi-tiered testing strategy:

```text
        ▲
       / \         End-to-End (E2E) Tests
      /   \        - Full user journey (Next.js UI to API)
     /-----\
    /       \      Integration Tests
   /         \     - Fastify HTTP endpoints (app.inject) + SQLite DB
  /-----------\
 /             \   Unit Tests
/               \  - Isolated Services, AI response parser, business rules
-----------------
```

1. **Unit Tests**: Verify individual functions, business logic rules in Services, and utility functions in complete isolation.
2. **Integration Tests**: Verify the interaction between Fastify Routes, Controllers, Services, and the SQLite database using `fastify.inject()`.
3. **E2E Tests**: Verify complete critical user workflows from the Next.js UI to backend responses.

---

## 2. Test Commands & Scripts

### Backend (`/backend`)

```bash
# Run all backend tests
npm test

# Run unit tests only
npm run test:unit

# Run HTTP integration tests
npm run test:integration

# Run tests with coverage reporting
npm run test:coverage
```

### Frontend (`/frontend`)

```bash
# Run frontend unit & component tests
npm test

# Run E2E test suite (Playwright)
npm run test:e2e
```

---

## 3. Integration Testing with Fastify (`app.inject`)

Avoid spinning up live network ports during integration tests. Instead, use Fastify's native `inject()` method:

```typescript
import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

describe('POST /api/issues', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ testMode: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an issue and return 201 with AI classification', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/issues',
      payload: {
        title: 'Payment gateway timeout',
        description: 'Users cannot submit credit card checkout.'
      }
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.category).toBeDefined();
    expect(body.data.urgency).toBeDefined();
    expect(body.data.status).toBe('open');
  });

  it('should return 400 when title is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/issues',
      payload: {
        description: 'Missing title'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 4. Mocking External Services (Gemini AI API)

- **Do NOT make real external API calls during automated CI/CD tests**:
  - Eliminates network flakiness.
  - Prevents API quota consumption and unexpected token costs.
  - Enables deterministic testing of edge cases (e.g., malformed JSON, rate limit 429, timeouts).
- Provide a mock implementation of the AI classification service:

```typescript
export const mockAIService = {
  classifyIssue: jest.fn().mockResolvedValue({
    category: 'BUG',
    urgency: 'HIGH',
    confidenceScore: 0.95,
    summary: 'Payment gateway timeout during checkout.',
    reasoning: 'Critical customer path blocked.',
    suggestedAction: 'Check payment provider logs.'
  })
};
```

---

## 5. Database Isolation in Tests

- Use an in-memory SQLite database (`:memory:`) or dedicated test database file (`test.sqlite`) during test execution.
- Reset the schema and clear tables before or after each test suite to prevent state leakage:

```typescript
beforeEach(() => {
  db.exec('DELETE FROM issues');
});
```

---

## 6. Required Test Coverage Checklist for Changes

Whenever introducing a new feature or endpoint, the change **MUST** include:

- [ ] **Happy Path Test**: Verify standard successful execution and expected status code (`200` or `201`).
- [ ] **Validation Test**: Verify payload/param validation errors return `400 Bad Request` with standard error envelope.
- [ ] **Resource Not Found Test**: Verify requests for non-existent IDs return `404 Not Found`.
- [ ] **State Transition Test**: Verify invalid lifecycle changes return appropriate error codes (`400 Bad Request` or `422 Unprocessable Entity`).
- [ ] **AI Failure / Fallback Test**: Verify that AI classification errors or timeouts trigger the fallback classification gracefully without crashing.
