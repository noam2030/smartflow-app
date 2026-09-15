# Code Style, Consistency, and Architecture Guidelines

This document outlines the coding standards, architectural rules, and conventions for the SmartFlow repository. All agents and contributors must follow these guidelines strictly.

---

## 1. General Principles

- **Clean & Readable**: Code is read much more often than it is written. Optimize for clarity and self-documentation.
- **Strict Layer Separation**: Do not leak concerns across architectural boundaries.
- **DRY (Don't Repeat Yourself)**: Reuse shared types, validation schemas, utility functions, and components across both backend and frontend.

---

## 2. TypeScript Standards

- **Strict Type Checking**: All TypeScript code must compile under `strict: true` without errors or warnings.
- **No Implicit `any`**: Explicitly type function parameters, return values, and complex data structures. Avoid `any`; use `unknown` if the type is truly dynamic, followed by type narrowing or schema validation.
- **Explicit Interfaces & Types**: Define clear TypeScript interfaces or type aliases for all domain models, DTOs, and API responses.
- **Discriminated Unions**: Use discriminated unions when handling polymorphic data or multi-state workflows (e.g., issue status transitions).

---

## 3. Backend Architecture (Fastify & Node.js)

### Strict 3-Tier Layering

```text
HTTP Request ──► Routes ──► Controllers ──► Services ──► DB / External APIs
```

#### A. Routes (`/backend/src/routes/`)
- Pure routing definitions and HTTP method mappings (`fastify.get`, `fastify.post`, `fastify.patch`, etc.).
- Bind input/output validation schemas using TypeBox or Zod.
- **Rule:** Under no circumstances should business logic, calculation, or database access reside in Routes.
- **Pattern:**
  ```typescript
  export async function issuesRoutes(fastify: FastifyInstance) {
    fastify.post('/issues', { schema: createIssueSchema }, issuesController.createIssue);
    fastify.get('/issues', { schema: getIssuesSchema }, issuesController.getIssues);
  }
  ```

#### B. Controllers (`/backend/src/controllers/`)
- Parse and validate incoming `request.body`, `request.params`, and `request.query`.
- Call appropriate methods on the Service layer.
- Format the HTTP response envelope and assign the appropriate HTTP status code (`200`, `201`, `400`, `404`, etc.).
- Catch unexpected errors and forward them or return standard error envelopes.
- **Rule:** Controllers do not interact with the database directly.

#### C. Services (`/backend/src/services/`)
- Encapsulate all domain business rules, validation calculations, and database queries.
- Decoupled from Fastify request and reply objects (`FastifyRequest`, `FastifyReply`).
- Pure, easily testable functions that receive plain data and return plain domain objects.
- Third-party integrations (e.g., Gemini AI API, SQLite database) must be accessed via services or dedicated client wrappers.

---

## 4. Frontend Standards (Next.js, React, TailwindCSS)

- **Component Architecture**: Functional components utilizing React hooks. Each component must define an explicit `interface Props { ... }`.
- **Styling with TailwindCSS**:
  - Use Tailwind utility classes for all styling.
  - Avoid inline CSS styles (`style={{ ... }}`).
  - Maintain consistent color palettes, typography, and spacing according to design tokens.
- **Component Reusability**: Extract shared UI elements (e.g., `Badge`, `StatusDropdown`, `Button`, `IssueCard`, `LoadingSpinner`) into reusable components under `frontend/src/components/`.
- **State Management & Data Fetching**:
  - Prefer clean React state (`useState`, `useCallback`, `useMemo`) and custom hooks for business logic.
  - Implement optimistic UI updates where appropriate (e.g., updating issue status immediately in the UI with automatic rollback on error).

---

## 5. Naming Conventions

| Item | Convention | Example |
| :--- | :--- | :--- |
| **Files & Directories** | `kebab-case` | `issues-controller.ts`, `issue-card.tsx`, `ai-tagging.service.ts` |
| **Classes, Interfaces, Types** | `PascalCase` | `IssueRecord`, `CreateIssueInput`, `AIAnalysisResult` |
| **Functions & Methods** | `camelCase` | `createIssue`, `classifyReport`, `getIssueById` |
| **Variables & Properties** | `camelCase` | `issueTitle`, `confidenceScore`, `updatedAt` |
| **Constants & Enum Values** | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `IssueStatus.IN_PROGRESS` |
| **React Components** | `PascalCase` | `IssueList`, `StatusBadge`, `FilterPanel` |

---

## 6. Import Ordering

Organize imports into distinct, sorted groups separated by blank lines:

1. Node.js built-ins (`import path from 'node:path';`)
2. Third-party dependencies (`import fastify from 'fastify';`)
3. Internal aliased modules / shared types (`import { Issue } from '@/types';`)
4. Relative local imports (`import { issuesService } from './issues.service';`)

---

## 7. Security & Input Sanitization

- **SQL Injection Prevention**: Always use parameterized queries or prepared statements via `better-sqlite3`. Never concatenate raw strings into SQL queries.
- **Payload Validation**: Strictly validate all request bodies, route parameters, and query parameters against validation schemas before processing.
- **Environment Secrets**: Secrets (e.g., `GEMINI_API_KEY`) must never be hardcoded or committed to version control. Load exclusively from environment variables (`process.env`).
