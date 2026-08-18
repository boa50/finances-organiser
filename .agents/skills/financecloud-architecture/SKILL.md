---
name: financecloud-architecture
description: Use when planning or implementing features in the FinanceCloud React Native/Expo personal finance app, especially when changes cross screens, services, types, API routes, persistence, or shared state.
---

# FinanceCloud Architecture

## Goal

Keep FinanceCloud's architecture coherent, modular, and maintainable by adhering to the established 3-tier component architecture, custom hook layer, service-oriented data access, and strict API-database boundaries.

---

## Architecture Layers

### 1. Presentation Layer (3-Tier Component Hierarchy)
- **Tier 1 — Atomic UI Primitives (`src/components/ui/`)**: Pure, domain-agnostic UI primitives (`AppText`, `AppTextInput`, `AppButton`, `AppIconButton`, `AppCard`, `AppBadge`, `AppIconBadge`, `AppSectionHeader`, `AppSegmentedControl`, `AppEmptyState`, `AppLoadingView`, `AppModal`, `AppSwitch`, `AppChipSelector`, `AppDatePicker`, `AppDraggableList`, `FeedbackMessage`).
- **Tier 2 — Domain Composite Components (`src/components/<domain>/`)**: Feature-specific reusable widgets (`management/EntityManagementCard`, `charts/`, `analytics/`, `overview/`, `transactions/`, `subscriptions/`).
- **Tier 3 — Screens & Layout Chrome (`src/screens/`, `src/components/AppHeader.tsx`, `AppTabBar.tsx`)**: Feature screens managing lifecycle, modal open/close state, and passing callbacks to domain components.

> Refer to the **`financecloud-design-system`** skill for detailed component contracts, design tokens, and canonical recipes.

### 2. Custom Hooks Layer (`src/hooks/`)
- `useAppData.ts`: Manages global initial data loading (categories, payment methods, banks, currencies, rates, transactions, subscriptions) and global transaction operations.
- `useAuth.ts`: Manages session auth state and login/logout workflows.
- `useEvolutionChartD3.ts`: Encapsulates D3 layout, monthly aggregation, and SVG scaling logic for financial trend charts.

### 3. Service Layer (`src/services/`)
- Client-side data services (`tursoService`, `categoryService`, `paymentMethodService`, `bankService`, `currencyService`, `subscriptionService`).
- Shared persistence helpers (`localStorageHelper.ts`, `apiClient.ts`).
- Automatic background generators (`subscriptionAutoGenerator.ts`).

### 4. API & Database Layer (`/api/` & Turso/libSQL)
- Serverless API routes (`/api/transactions`, `/api/categories`, `/api/payment-methods`, `/api/banks`, `/api/auth`, `/api/health`).
- Database client and migrations in `api/_db.ts`.

---

## Data Flow Pattern

```text
Screen / Component
       │
       ▼ (invokes service methods)
Client Service (src/services/*)
       │
       ├──► (online) ──► /api/* (Vercel Serverless) ──► Turso SQLite Cloud
       │
       └──► (offline fallback) ──► localStorageHelper / AsyncStorage
```

---

## Architecture Constraints

1. **Never bypass the API layer**: Client code must never import `api/_db.ts` or access `TURSO_AUTH_TOKEN`.
2. **State management**: React `useState` / `useEffect` and custom hooks in `src/hooks/` are used. Do not introduce external state libraries (Redux, Zustand, MobX) unless explicitly approved.
3. **Navigation**: Tab navigation is handled in `App.tsx` and `AppTabBar.tsx`. Do not migrate to Expo Router or React Navigation without explicit instruction.
4. **Component Reuse**: Never write custom inline `<Modal>`, `<Switch>`, or `<Pressable>` icon buttons when standardized UI primitives exist.
5. **Shared Types**: Use centralized interfaces in `src/types/index.ts`. Never introduce duplicate type definitions in local component files.
