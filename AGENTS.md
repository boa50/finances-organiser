# FinanceCloud — Agent Instructions

## Project overview

FinanceCloud is a cross-platform personal finance tracker built with React Native and Expo.

Supported platforms:
- Web
- Android
- iOS

Core technologies:
- React Native
- Expo
- TypeScript
- Vercel Serverless Functions
- Turso/libSQL SQLite Cloud
- localStorage offline fallback
- D3.js + react-native-svg
- AwesomeAPI exchange rates
- Jest + ts-jest (unit testing)
- Lucide React Native (icons)

The repository is structured around a root `App.tsx` with password authentication gating, manual tab navigation, shared state passed through props, design system tokens in `src/theme.ts`, UI primitive components under `src/components/ui/`, client-side services under `src/services/`, and server-side API functions under `api/`.

---

## Important architecture

### Client → API → database

For cloud persistence, follow this flow:

`Screen/Component → src/services → /api/* → Turso/libSQL`

Never bypass the API layer from client code to access Turso.

### Authentication

App access is gated by a single password:

- Server secret: `APP_PASSWORD` environment variable.
- Server endpoint: `POST /api/auth` (uses `crypto.timingSafeEqual` side-channel defense).
- Client service: `src/services/authService.ts` manages authentication state and persists sessions in `sessionStorage`.
- Fallback: In standalone Metro dev mode (`npm start`), if `/api/auth` returns HTML (due to SPA rewrites), the client falls back to `EXPO_PUBLIC_APP_PASSWORD`.
- Gate screen: `src/screens/LoginScreen.tsx` wraps the application in `App.tsx`.

### Design system & UI primitives

Design tokens are centralized in:

```text
src/theme.ts
```

Includes `palette`, `colors`, `spacing`, `radii`, `fontSize`, `fontWeight`, `fontFamily`, and `typography` presets.

All components and screens **MUST** use tokens from `src/theme.ts` — never hardcode font sizes, font weights, colors, or spacing values directly.

Reusable UI primitives live under:

```text
src/components/ui/
```

Available UI primitives (exported via `src/components/ui/index.ts` barrel):
- `AppText`: Standardized text wrapper enforcing `theme.typography` and `theme.fontFamily.sans`.
- `AppTextInput`: Styled text input with icon support, clear button, and error state.
- `AppButton`: Variant button (`primary`, `secondary`, `outline`, `danger`, `ghost`) with loading spinner.
- `AppCard`: Surface container (`default`, `elevated`, `outlined`, `glass`) with touchable support.
- `AppBadge`: Status pill tag with variant colors and status dots (`success`, `warning`, `danger`, `info`, `neutral`, `accent`).
- `AppIconBadge`: Rounded icon container with status-tinted background.
- `AppSectionHeader`: Header container with title, subtitle, and action button slots.
- `AppSegmentedControl`: Segmented tab filter control.
- `AppEmptyState`: Empty data view with icon, title, description, and optional action button.
- `FeedbackMessage`: Toast / banner notification alert.

When implementing a new screen or component: **always prefer reusing existing UI primitives** over writing custom inline elements.

Vector icons:
- `src/components/CategoryIcon.tsx` maps icon string names to Lucide React Native vector components.
- **No emojis** should be used anywhere in the app layout or component buttons. The only allowed emojis are country flags representing currency codes (e.g. `🇧🇷`, `🇺🇸`, `🇪🇺`).

### Installments & transaction groups

- Expense transactions support multi-month installment plans (`installments > 1`).
- Each installment item includes `installmentNumber`, `installments`, and a unique `installmentGroupId`.
- Deleting an installment item prompts the user with options to delete only that specific installment or delete all installments in the group.
- The `store` field records the merchant/store name associated with a transaction.

### Offline fallback

When the cloud API is unavailable, the existing services fall back to `localStorage`.

Do not redesign synchronization behavior unless explicitly requested.

Do not silently treat local data as successfully synchronized with the cloud.

### State management

The current application uses React `useState` / `useEffect` and passes state through `App.tsx`.

Do not introduce Redux, Zustand, MobX, or another state-management library unless explicitly requested.

### Navigation

Navigation is currently implemented manually in `App.tsx`.

Do not migrate to Expo Router or another navigation system unless explicitly requested.

### Platform-specific code

Use Expo/React Native platform conventions.

Existing platform-specific date-picker files:

- `TransactionDatePicker.native.tsx`
- `TransactionDatePicker.web.tsx`

Prefer `.native.tsx` / `.web.tsx` when behavior genuinely differs between native and Web.

---

## Repository structure

Important locations:

```text
api/
├── _db.ts
├── auth.ts
├── health.ts
├── transactions.ts
├── categories.ts
├── payment-methods.ts
└── banks.ts

src/
├── theme.ts
├── types/
│   └── index.ts
├── services/
│   ├── __tests__/
│   │   ├── authService.test.ts
│   │   └── categoryService.test.ts
│   ├── tursoService.ts
│   ├── categoryService.ts
│   ├── authService.ts
│   ├── bankService.ts
│   └── paymentMethodService.ts
├── utils/
│   ├── __tests__/
│   │   ├── authUtils.test.ts
│   │   ├── currencies.test.ts
│   │   └── financials.test.ts
│   ├── currencies.ts
│   ├── financials.ts
│   └── authUtils.ts
├── screens/
│   ├── OverviewScreen.tsx
│   ├── AnalyticsScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── ManagementScreen.tsx
│   ├── LoginScreen.tsx
│   └── CategoryManagementScreen.tsx
└── components/
    ├── ui/
    │   ├── AppText.tsx
    │   ├── AppTextInput.tsx
    │   ├── AppButton.tsx
    │   ├── AppCard.tsx
    │   ├── AppBadge.tsx
    │   ├── AppIconBadge.tsx
    │   ├── AppSectionHeader.tsx
    │   ├── AppSegmentedControl.tsx
    │   ├── AppEmptyState.tsx
    │   ├── FeedbackMessage.tsx
    │   └── index.ts
    ├── CategoryIcon.tsx
    ├── D3CurrentMonthCharts.tsx
    ├── D3EvolutionChart.tsx
    ├── TransactionEditModal.tsx
    ├── TransactionDatePicker.tsx
    ├── TransactionDatePicker.native.tsx
    └── TransactionDatePicker.web.tsx

App.tsx
index.ts
app.json
vercel.json
package.json
jest.config.js
tsconfig.json
.env.example
```

Before creating a new abstraction, inspect the relevant existing files and determine whether the functionality already belongs in an existing service/component.

---

## General development rules

### 1. Inspect before editing

Before implementing a non-trivial change:

1. Inspect the relevant files.
2. Understand how data currently flows.
3. Identify existing components/services/utilities that can be reused.
4. Identify the smallest set of files that need to change.
5. Then implement.

Do not make speculative repository-wide changes.

### 2. Keep changes focused

Only modify files necessary for the requested task.

Do not:
- perform unrelated refactors;
- rename unrelated files;
- reformat the entire project;
- replace existing libraries without a reason;
- rewrite working code simply because another architecture is preferred.

### 3. Prefer existing patterns

Before adding a dependency, abstraction, service, component, or utility:

- search the repository;
- check whether an existing implementation can be extended;
- reuse established project patterns where practical.

### 4. Preserve existing behavior

Unless the task explicitly requests a behavior change, preserve existing functionality.

When a proposed change could affect existing transaction, category, currency, persistence, or platform behavior, call out the potential impact before making a broad change.

### 5. TypeScript

Use TypeScript types throughout the project.

Avoid `any` unless there is a clear technical reason.

Prefer shared interfaces/types in:

```text
src/types/index.ts
```

When changing a data structure, update all relevant consumers rather than introducing inconsistent duplicate types.

---

## Financial data rules

FinanceCloud handles financial information, so correctness is especially important.

### Transactions

Be careful with:
- income vs expense semantics;
- positive/negative values;
- transaction dates;
- category, payment method, bank, and store associations;
- installment numbers and installment group IDs;
- monthly grouping;
- currency;
- deletion and editing behavior.

Do not change the meaning of transaction amounts without explicitly discussing the impact.

### Categories

Categories can contain:
- name;
- type (`income` | `expense`);
- icon (Lucide string name mapped via `CategoryIcon`);
- color;
- `isDefault` flag.

Preserve existing category metadata when editing categories.

Default category seeding must remain safe to run without unnecessarily duplicating categories.

### Payment Methods

Payment methods can contain:
- name;
- `allowInstallments` flag;
- `isDefault` flag.

Managed via `paymentMethodService.ts` and `api/payment-methods.ts`.

### Banks

Banks contain:
- name;
- `isDefault` flag.

Managed via `bankService.ts` and `api/banks.ts`.

### Currency

Supported currencies:

```text
BRL
USD
EUR
GBP
CAD
AUD
JPY
CHF
INR
```

Currency conversion currently uses BRL as the pivot.

Exchange rates are cached for 60 seconds.

Important rules:

- Do not convert the same amount twice.
- Do not round prematurely during calculations.
- Use existing currency utilities instead of duplicating conversion logic.
- Keep numeric conversion separate from display formatting.
- Handle missing or unavailable exchange rates safely.
- Avoid NaN/Infinity values in financial calculations.

---

## Database and API rules

### Security

Turso credentials and application passwords must remain server-side.

Never expose:

```text
TURSO_AUTH_TOKEN
APP_PASSWORD
```

to client-side code without the `EXPO_PUBLIC_` prefix intended for offline dev fallback.

Never hard-code credentials.

Never commit `.env` or real secrets.

`.env.example` must contain placeholders only.

### API

API routes live in:

```text
api/
```

Current routes:

```text
GET    /api/health
POST   /api/auth
GET|POST|PUT|DELETE /api/transactions
GET|POST|PUT|DELETE /api/categories
GET|POST|PUT|DELETE /api/payment-methods
GET|POST|PUT|DELETE /api/banks
```

When modifying an API route:

1. Validate the HTTP method.
2. Validate input.
3. Use parameterized SQL.
4. Return appropriate HTTP status codes.
5. Avoid leaking database credentials or sensitive implementation details.
6. Preserve existing request/response contracts unless the task explicitly changes them.

Reuse:

```text
api/_db.ts
```

for database access instead of creating another database client.

### Database schema changes

Before modifying schema or migration behavior:

1. Inspect the existing schema/migration logic in `api/_db.ts`.
2. Consider existing production data.
3. Prefer additive/backward-compatible changes.
4. Consider both fresh databases and existing databases.
5. Update types, API routes, services, and UI as required.

Do not make destructive schema changes without explicit approval.

---

## React Native / Expo rules

### UI

Reuse existing components and visual patterns from `src/theme.ts` and `src/components/ui/`.

When implementing a screen or component:

- support loading states;
- support empty states (use `AppEmptyState`);
- support error states (use `FeedbackMessage`);
- support disabled states where appropriate;
- ensure touch targets are usable on mobile;
- ensure Web interactions remain usable;
- avoid unnecessary re-renders.

Do not introduce a new UI library unless explicitly requested.

### Forms

Forms should:
- validate input;
- provide clear validation feedback;
- prevent invalid submissions;
- handle loading/submission states;
- preserve existing data when editing.

### Responsive behavior

When changing UI, consider:

- Android;
- iOS;
- Web;
- narrow screens;
- larger Web layouts.

Do not assume Web and native layout behavior are identical.

---

## Charts and analytics

D3 is used for data calculations/layout (`d3.pie`, `d3.arc`, `d3.line`, `d3.area`).

`react-native-svg` is used for rendering.

SVG text elements must use `theme.fontFamily.sans`, `theme.fontSize`, and `theme.fontWeight` for font consistency.

Do not introduce another charting library unless explicitly requested.

Before modifying analytics:

1. Inspect existing aggregation logic in `src/utils/financials.ts`.
2. Verify the underlying transaction data.
3. Verify currency conversion.
4. Check empty-data behavior.
5. Check zero values.
6. Check single-data-point cases.
7. Check Web and native rendering.

Financial totals shown by charts must reconcile with the underlying transaction data.

---

## Development commands

Use the commands already defined in `package.json` whenever possible.

Common commands:

```bash
npm install
npm start
npm run web
npx vercel dev
npm test
```

Before assuming a command exists, inspect `package.json`.

For serverless development:

```bash
npx vercel dev
```

For Web development:

```bash
npm run web
```

For unit testing:

```bash
npm test
```

---

## Validation procedure

After implementing a meaningful change:

### Step 1 — Inspect the diff

Review:

```bash
git diff
```

Make sure unrelated files were not modified.

### Step 2 — Type checking

Run the project's configured TypeScript check:

```bash
npx tsc --noEmit
```

Inspect `package.json` and `tsconfig.json` before choosing the exact command.

### Step 3 — Unit tests

Run the Jest test suite:

```bash
npm test
```

Refer to [`TEST_CASES.md`](./TEST_CASES.md) for the active test suites, acceptance criteria, and automation coverage mapping. Ensure all automated tests pass cleanly.

### Step 4 — Build

For changes affecting Web/build configuration, run the Expo Web build:

```bash
npx expo export -p web
```

### Step 5 — API validation

For API changes, use `npx vercel dev` and exercise the affected endpoint when practical.

### Step 6 — Platform validation

For UI changes, test the relevant platform(s).

### Step 7 — Final review

Check for:

- TypeScript errors;
- runtime errors;
- broken imports;
- missing loading/error states;
- accidental secrets;
- incorrect financial calculations;
- broken API contracts;
- unnecessary changes.

Report what was actually tested. Do not claim a test was run if it was not.

---

## Git rules

Do not create commits unless explicitly requested.

Before asking the user to commit, make sure the working tree contains only intended changes.

Prefer small, focused changes that are easy to review and revert.

---

## Agent workflow

For substantial tasks, use this workflow:

### Phase 1 — Understand

Inspect the relevant code and summarize:

- current behavior;
- relevant files;
- dependencies;
- likely implementation approach.

Do not modify files yet when the task is architectural or ambiguous.

### Phase 2 — Plan

Create a concise implementation plan.

Identify:
- files to change;
- new files, if any;
- data/API changes;
- validation steps;
- potential risks.

### Phase 3 — Implement

Implement one logical increment at a time.

Avoid unrelated refactoring.

### Phase 4 — Validate

Run the most relevant type checks, tests, builds, or endpoint checks.

Fix issues caused by the implementation.

### Phase 5 — Review

Inspect the final diff.

Look specifically for:
- unintended changes;
- duplicated logic;
- security issues;
- financial calculation errors;
- cross-platform problems.

### Phase 6 — Report

Give a concise summary:

```text
Implemented:
- ...

Validated:
- ...

Not validated:
- ...

Potential follow-up:
- ...
```

---

## When to ask for clarification

Ask before implementing when:

- requirements conflict with the current architecture;
- a database migration could be destructive;
- synchronization behavior is ambiguous;
- an API contract would need to change unexpectedly;
- a security-sensitive decision is unclear;
- there are multiple materially different interpretations of the requested behavior.

For minor implementation details, make the smallest reasonable assumption and continue.

---

## Skill usage

Project-specific Skills are stored under:

```text
.agents/skills/
```

Use the relevant skill when the task matches it.

Available FinanceCloud skills include:

- `financecloud-architecture`
- `financecloud-react-native`
- `financecloud-data-layer`
- `financecloud-analytics`
- `financecloud-quality`
- `financecloud-deployment`

Prefer loading specialized Skills for detailed procedures rather than duplicating large amounts of specialized knowledge in every task.

---

## Updating agent instructions

Do not modify `AGENTS.md` or files under `.agents/skills/` during normal feature implementation unless explicitly asked.

If you identify a recurring project rule, architectural decision, or constraint that would improve future work, mention it in the final report under "Potential instruction improvement."

Only modify agent instructions after explicit approval.

---

## Test case workflow

`TEST_CASES.md` is the source of truth for application-level acceptance criteria.

When implementing a feature:

1. Search `TEST_CASES.md` for relevant test cases.
2. Identify which cases are affected.
3. Before coding, summarize the relevant acceptance criteria.
4. Implement the smallest change necessary.
5. Validate the affected test cases.
6. Update the test case status only when the requirement has actually been verified.
7. Do not mark a test as passing based solely on code inspection.
8. If a test cannot be verified, leave it as `🟡` and explain why.
9. If implementation reveals a missing edge case, propose a new test case rather than silently changing the requirements.

---

## Priority

When instructions conflict, prioritize:

1. User's explicit request.
2. Security and data integrity.
3. Existing FinanceCloud architecture and behavior.
4. These project instructions.
5. Specialized Skills for the current task.
6. General coding preferences.

When uncertain, prefer a small, reversible change over a broad architectural change.
