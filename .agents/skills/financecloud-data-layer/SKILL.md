---
name: financecloud-data-layer
description: Use when modifying FinanceCloud transactions, categories, payment methods, banks, currencies, subscriptions, persistence, CRUD operations, Turso/libSQL, Vercel API routes, offline fallback, or synchronization behavior.
---

# FinanceCloud Data Layer

## Goal

Preserve reliable CRUD and offline-first persistence across all entities (transactions, categories, payment methods, banks, currencies, subscriptions) while maintaining strict server-side isolation for Turso credentials.

---

## Data Flow

### Cloud Persistence:
`Screen / Component -> src/services/* -> /api/* (Vercel Serverless) -> Turso/libSQL`

### Offline Fallback:
`Screen / Component -> src/services/* -> localStorageHelper -> localStorage / AsyncStorage`

---

## Data Layer Modules

### Client Services (`src/services/`):
- `tursoService.ts`: Transaction CRUD, database initialization, clear all transactions, config status.
- `categoryService.ts`: Category CRUD, ordering, default seeding, offline sync.
- `paymentMethodService.ts`: Payment method CRUD, ordering, installments permission flag, offline sync.
- `bankService.ts`: Bank entity CRUD, ordering, default seeding, offline sync.
- `currencyService.ts`: Currency catalog CRUD, enable/disable toggles, pivot rate caching.
- `subscriptionService.ts`: Recurring subscription CRUD, next charge computation.
- `subscriptionAutoGenerator.ts`: Auto-generates transaction records for active subscriptions due in current month.
- `localStorageHelper.ts`: Standardized generic local storage loader, saver, and key manager.
- `apiClient.ts`: Authenticated fetch wrapper for `/api/*` endpoints.

### API Routes (`api/`):
- `GET|POST|PUT|DELETE /api/transactions`
- `GET|POST|PUT|DELETE /api/categories`
- `GET|POST|PUT|DELETE /api/payment-methods`
- `GET|POST|PUT|DELETE /api/banks`
- `POST /api/auth` (timingSafeEqual verification)
- `GET /api/health`

---

## Implementation Rules

1. **Inspect before adding**: Extend existing services before creating new ones; use `localStorageHelper.ts` for storage boilerplate.
2. **Strict credential isolation**: Never import `api/_db.ts` or expose `TURSO_AUTH_TOKEN` in client code.
3. **Additive field changes**: When modifying an entity schema:
   - Update `src/types/index.ts`.
   - Update the client service and `localStorageHelper` serialization.
   - Update `api/_db.ts` table definitions and migrations.
   - Update `/api/*` endpoint request validation and parameterized SQL.
   - Update affected forms, modals, and UI cards.
4. **Parameterized queries**: All server-side SQL queries must use parameterized placeholders (`?`, `:param`).
5. **Preserve offline reliability**: When cloud API fails, gracefully fallback to local cache without data loss.
