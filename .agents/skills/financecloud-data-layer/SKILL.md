---
name: financecloud-data-layer
description: Use when modifying FinanceCloud transactions, categories, persistence, CRUD operations, Turso/libSQL, Vercel API routes, offline fallback, or synchronization behavior.
---

# FinanceCloud Data Layer

## Goal

Preserve reliable CRUD and offline-first behavior while keeping Turso credentials server-side.

## Data flow

Cloud path:

`Screen/Component -> Service in src/services -> /api/* Vercel Function -> Turso/libSQL`

Offline fallback:

`Screen/Component -> Service -> localStorage`

Relevant files:

- `src/services/tursoService.ts`
- `src/services/categoryService.ts`
- `api/_db.ts`
- `api/transactions.ts`
- `api/categories.ts`
- `api/health.ts`
- `src/types/index.ts`

## Rules

1. Inspect the existing service implementation before adding another persistence abstraction.
2. Keep database credentials exclusively in server-side `/api` code.
3. Client code must never import or expose `TURSO_AUTH_TOKEN`.
4. Reuse shared TypeScript interfaces.
5. Keep API request/response shapes consistent with existing routes unless the task explicitly changes them.
6. Handle API failures without destroying valid local data.
7. When adding a field:
   - update the shared type;
   - update the client service;
   - update the API route;
   - update database migration/schema logic;
   - update localStorage serialization if applicable;
   - update affected screens/forms.
8. Preserve existing CRUD semantics for transactions and categories.
9. Do not silently overwrite cloud data with stale local data.
10. If synchronization semantics are ambiguous, stop and explain the risk before implementing automatic merging.

## API route expectations

- Validate HTTP method.
- Validate required input.
- Return appropriate HTTP status codes.
- Handle database errors without leaking credentials or sensitive internals.
- Keep SQL parameterized.
- Reuse `api/_db.ts` rather than creating independent database clients.

## Offline behavior

When the cloud API is unavailable:
- Use the existing localStorage fallback.
- Make the UI clear about failure only when appropriate.
- Do not treat an offline write as confirmed cloud persistence unless the existing app explicitly defines that behavior.

## Database changes

Before changing schema/migration logic:
1. Inspect existing tables and migration behavior.
2. Consider existing users/data.
3. Make migrations additive and backward-compatible where practical.
4. Test both a fresh database and an existing database.
