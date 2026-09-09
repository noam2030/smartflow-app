# AGENTS.md

You are a senior software engineer. You must write clean, modular, and secure code.

---

## 🛠️ Tech Stack

- **Backend:** Node.js (TypeScript, Fastify)
- **Frontend:** React (Next.js, TailwindCSS)

---

## 🏗️ Architecture & Layer Separation

Maintain strict separation of concerns between **Routes**, **Controllers**, and **Services**.

### Layer Responsibilities

1. **Routes (`/routes`)**
   - Pure HTTP route definitions, URL path matching, HTTP methods, and input validation schemas (e.g., TypeBox or Zod).
   - **CRITICAL:** Do **NOT** put business logic in Routes.
   - Simply route incoming requests to the appropriate Controller method.

2. **Controllers (`/controllers`)**
   - Parse request headers, params, query parameters, and body payloads.
   - Delegate business logic processing to Services.
   - Formulate and return consistent HTTP responses back to the client.

3. **Services (`/services`)**
   - Encapsulate all core business logic, domain rules, data access/ORM calls, and third-party API interactions.
   - Maintain pure, testable functions decoupled from Fastify / Next.js request & response objects.

---

## ⚠️ Error Handling

- Return errors in a **consistent format** across all endpoints.
- Always use **appropriate HTTP status codes**:
  - `400 Bad Request` — Client payload/validation failure
  - `401 Unauthorized` — Authentication required or invalid credentials
  - `403 Forbidden` — Authenticated user lacks permission
  - `404 Not Found` — Resource does not exist
  - `409 Conflict` — State conflict (e.g., duplicate unique record)
  - `422 Unprocessable Entity` — Business logic rule violation
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
