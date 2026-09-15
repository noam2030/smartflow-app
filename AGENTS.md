# AGENTS.md

You are a senior software engineer. You must write clean, modular, and secure code.
This document is the **Single Source of Truth (SSOT)** and central governance policy for the SmartFlow repository.

---

## 🧭 Mandatory Governance for Future Agents

> [!IMPORTANT]
> **MANDATORY PREREQUISITE BEFORE MAKING ANY CODE CHANGES:**
> Every autonomous agent operating in this repository **MUST** read and adhere to the relevant specification and rule documents before proposing or implementing changes:
>
> 1. [`.agents/rules/code-style.md`](file:///Users/noam/Documents/AI/smartflow-app/.agents/rules/code-style.md) — Coding conventions, TypeScript standards, and 3-tier architectural layer separation.
> 2. [`.agents/rules/testing.md`](file:///Users/noam/Documents/AI/smartflow-app/.agents/rules/testing.md) — Testing protocols (unit, integration, E2E) and verification commands.
> 3. [`.agents/rules/ai-tagging.md`](file:///Users/noam/Documents/AI/smartflow-app/.agents/rules/ai-tagging.md) — Agentic loop for Gemini AI classification, JSON schema enforcement, and retry/fallback logic.
> 4. [`docs/specs/openapi.yaml`](file:///Users/noam/Documents/AI/smartflow-app/docs/specs/openapi.yaml) — Official OpenAPI contract for all HTTP endpoints and data models.
> 5. [`docs/specs/issue-lifecycle.md`](file:///Users/noam/Documents/AI/smartflow-app/docs/specs/issue-lifecycle.md) — Product specification governing issue statuses (`open`, `in_progress`, `resolved`) and allowed state transitions.

---

## 🛠️ Tech Stack

- **Backend:** Node.js (TypeScript, Fastify, SQLite with `better-sqlite3`)
- **AI Engine:** Google Gemini API (Structured JSON output with retry/validation loop)
- **Frontend:** React (Next.js App Router, TailwindCSS)

---

## 🏗️ System Architecture & Layer Separation

Maintain strict separation of concerns across the codebase:

```text
[ Client (Next.js) ]
         │
         ▼
[ Fastify Routes (/routes) ]       --> Pure HTTP definitions, URL params, request validation schemas
         │
         ▼
[ Controllers (/controllers) ]     --> Request extraction, HTTP response formatting, status codes
         │
         ▼
[ Services (/services) ]           --> Business logic, domain rules, DB operations, AI agentic loop
         │
         ├──────────────────────────────┐
         ▼                              ▼
[ SQLite Database ]             [ Gemini AI Triage Engine ]
```

### Layer Responsibilities

1. **Routes (`backend/src/routes`)**
   - Pure HTTP route definitions, URL path matching, HTTP methods, and input validation schemas (TypeBox or Zod).
   - **CRITICAL:** Do **NOT** put business logic in Routes.
   - Simply route incoming requests to the appropriate Controller method.

2. **Controllers (`backend/src/controllers`)**
   - Parse request headers, params, query parameters, and body payloads.
   - Delegate business logic processing to Services.
   - Formulate and return consistent HTTP responses back to the client.

3. **Services (`backend/src/services`)**
   - Encapsulate all core business logic, domain rules, data access/database calls, and external service interactions (such as the Gemini AI classification engine).
   - Maintain pure, testable functions decoupled from Fastify / Next.js request & response objects.

---

## ⚠️ Error Handling Standard

- Return errors in a **consistent format** across all endpoints.
- Always use **appropriate HTTP status codes**:
  - `400 Bad Request` — Client payload/validation failure
  - `401 Unauthorized` — Authentication required or invalid credentials
  - `403 Forbidden` — Authenticated user lacks permission
  - `404 Not Found` — Resource does not exist
  - `409 Conflict` — State conflict (e.g., duplicate unique record)
  - `422 Unprocessable Entity` — Business logic rule violation or AI classification parsing failure
  - `500 Internal Server Error` — Unexpected server failure

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_NAME",
    "message": "Human readable message describing the issue.",
    "statusCode": 400,
    "details": []
  }
}
```

- Centralize error handling using global Fastify error handlers and Next.js error middleware.

---

## 🔄 DRY (Don't Repeat Yourself)

- The **DRY principle is critical**.
- Avoid duplicating code, logic, or types across backend and frontend.
- Abstract reusable components, helper functions, utility modules, and database queries.
- Maintain shared types and schemas across client and server whenever applicable.
- Extract common UI patterns into reusable Next.js / React components styled with TailwindCSS.

---

## 🌿 Git & Branching Policy

- **CRITICAL:** Do **NOT** push directly to `main`.
- For every change or feature:
  1. Create a dedicated branch (e.g., `feat/<feature-name>`, `fix/<fix-name>`, or `chore/<task-name>`).
  2. Commit your changes with descriptive, conventional commit messages.
  3. Push the branch to `origin`.
  4. Open a Pull Request (PR) for review before merging into `main`.
