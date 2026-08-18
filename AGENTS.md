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

The design system follows a **3-Tier Component Architecture**:
- **Tier 1 — UI Primitives (`src/components/ui/`)**: Domain-agnostic atomic components (`AppText`, `AppTextInput`, `AppButton`, `AppIconButton`, `AppCard`, `AppBadge`, `AppIconBadge`, `AppSectionHeader`, `AppSegmentedControl`, `AppEmptyState`, `AppLoadingView`, `AppModal`, `AppSwitch`, `AppChipSelector`, `AppDatePicker`, `AppDraggableList`, `FeedbackMessage`).
- **Tier 2 — Domain-Level Components (`src/components/<domain>/`)**: Reusable composite widgets (`management/EntityManagementCard`, `charts/`, `analytics/`, `overview/`, `transactions/`, `subscriptions/`).
- **Tier 3 — App Chrome & Screens (`src/components/`, `src/screens/`)**: Top-level layout elements (`AppHeader`, `AppTabBar`, `CategoryIcon`) and feature screens.

For detailed prop contracts, visual tokens, and canonical component recipes, load the **`financecloud-design-system`** skill.

Vector icons:
- `src/components/CategoryIcon.tsx` maps icon string names to Lucide React Native vector components.
- Direct Lucide icons are used for UI controls and primitives (e.g. inside `AppIconButton`).
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

- `src/components/ui/AppDatePicker.native.tsx`
- `src/components/ui/AppDatePicker.web.tsx`

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
├── hooks/
│   ├── useAppData.ts
│   ├── useAuth.ts
│   └── useEvolutionChartD3.ts
├── services/
│   ├── __tests__/
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── bankService.ts
│   ├── categoryService.ts
│   ├── currencyService.ts
│   ├── localStorageHelper.ts
│   ├── paymentMethodService.ts
│   ├── subscriptionAutoGenerator.ts
│   ├── subscriptionService.ts
│   └── tursoService.ts
├── utils/
│   ├── __tests__/
│   ├── authUtils.ts
│   ├── currencies.ts
│   ├── dialogs.ts
│   ├── financials.ts
│   └── idGenerator.ts
├── screens/
│   ├── OverviewScreen.tsx
│   ├── AnalyticsScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── SubscriptionsScreen.tsx
│   ├── LoginScreen.tsx
│   └── management/
│       ├── ManagementScreen.tsx
│       ├── CategoryManagementTab.tsx
│       ├── PaymentMethodManagementTab.tsx
│       ├── BankManagementTab.tsx
│       ├── CurrencyManagementTab.tsx
│       ├── CategoryEditModal.tsx
│       ├── PaymentMethodEditModal.tsx
│       ├── BankEditModal.tsx
│       └── CurrencyAddModal.tsx
└── components/
    ├── ui/
    │   ├── AppText.tsx
    │   ├── AppTextInput.tsx
    │   ├── AppButton.tsx
    │   ├── AppIconButton.tsx
    │   ├── AppCard.tsx
    │   ├── AppBadge.tsx
    │   ├── AppIconBadge.tsx
    │   ├── AppSectionHeader.tsx
    │   ├── AppSegmentedControl.tsx
    │   ├── AppEmptyState.tsx
    │   ├── AppLoadingView.tsx
    │   ├── AppModal.tsx
    │   ├── AppSwitch.tsx
    │   ├── AppChipSelector.tsx
    │   ├── AppDatePicker.tsx
    │   ├── AppDatePicker.native.tsx
    │   ├── AppDatePicker.web.tsx
    │   ├── AppDraggableList.tsx
    │   ├── FeedbackMessage.tsx
    │   └── index.ts
    ├── management/
    │   ├── EntityManagementCard.tsx
    │   └── index.ts
    ├── charts/
    │   ├── IncomeExpenseDonutChart.tsx
    │   ├── CategorySpendingBarChart.tsx
    │   ├── EvolutionTrendChart.tsx
    │   └── index.ts
    ├── analytics/
    │   ├── MonthlyBreakdownCharts.tsx
    │   ├── MonthDetailSummaryCard.tsx
    │   └── index.ts
    ├── overview/
    │   ├── NetBalanceHeroCard.tsx
    │   └── index.ts
    ├── transactions/
    │   ├── TransactionItemCard.tsx
    │   ├── TransactionEditModal.tsx
    │   └── index.ts
    ├── subscriptions/
    │   ├── SubscriptionEditModal.tsx
    │   └── index.ts
    ├── AppHeader.tsx
    │   ├── AppTabBar.tsx
    │   ├── CategoryIcon.tsx
    │   └── index.ts

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

### 6. Reuse before creating

Before implementing any new UI, component, utility, hook, service, or other abstraction, the agent MUST search the existing codebase for reusable implementations.

The agent MUST prefer:
1. Reusing an existing component directly.
2. Extending an existing reusable component when appropriate.
3. Extracting duplicated logic into a reusable component or utility.
4. Creating a new component/abstraction only when no suitable existing implementation exists.

Do NOT duplicate existing UI, business logic, styling, validation, or data-access patterns merely because creating a new implementation is faster.

Before creating a new component, explicitly check:
- `src/components/`
- `src/components/ui/`
- `src/screens/`
- `src/services/`
- `src/utils/`
- relevant existing hooks and shared types.

When implementing a feature that is similar to an existing feature, inspect the existing implementation and reuse its patterns rather than creating a parallel implementation.

If two or more components contain substantially similar logic or UI, prefer extracting the common behavior into a reusable component, hook, or utility rather than maintaining duplicated code.

### Reuse decision

Before creating a new reusable component, answer internally:

- Does an existing component already provide this functionality?
- Can an existing component be extended without making it overly complex?
- Is the new implementation genuinely different enough to justify a separate component?
- Would extracting the shared behavior reduce duplication?

Only create a new abstraction when there is a clear reason to do so.

### Component consistency

When an existing reusable component exists, use it even if implementing the feature directly would be slightly faster.

Mandatory component mappings:
- Use `AppText` instead of creating custom `Text` styling or using raw React Native `<Text>`.
- Use `AppTextInput` for text inputs, numbers, and search boxes.
- Use `AppButton` instead of creating custom `Pressable` action buttons.
- Use `AppIconButton` (with `variant="edit"|"delete"|"duplicate"|"custom"`) instead of custom `<Pressable>` with icon children.
- Use `AppCard` instead of recreating custom surface/card containers.
- Use `AppBadge` for status pill tags and counters.
- Use `AppIconBadge` for rounded icon containers in card items.
- Use `AppSectionHeader` for section titles with subtitle/action slots.
- Use `AppSegmentedControl` for segmented tabs and time/filter selectors.
- Use `AppEmptyState` for empty data views.
- Use `AppLoadingView` for loading spinners and data-fetching views instead of standalone `<ActivityIndicator>`.
- Use `AppModal` for modal dialogues and forms instead of raw React Native `<Modal>`.
- Use `AppSwitch` for toggle switches instead of custom toggles or raw React Native `<Switch>`.
- Use `AppChipSelector` for option pill selection groups.
- Use `AppDatePicker` for date selection.
- Use `AppDraggableList` for reorderable entity lists.
- Use `FeedbackMessage` for toast alerts and banner notifications.
- Use `EntityManagementCard` for item rows in management screens (Categories, Payment Methods, Banks, Currencies).
- Use `CategoryIcon` for category icons.
- Use `confirmAction` from `src/utils/dialogs.ts` for confirmation dialogs.

Do not create another component that duplicates an existing UI primitive's responsibility. Refer to the `financecloud-design-system` skill for full prop signatures and composition recipes.

---

## Documentation rules

### README synchronization

`README.md` must be kept synchronized with the implemented application.

Whenever a new user-facing feature is implemented, the agent MUST review `README.md` and update it if the feature changes or adds:

- application functionality;
- supported features;
- user workflows;
- configuration or environment variables;
- installation or setup requirements;
- development commands;
- deployment requirements;
- supported platforms;
- architecture or important architectural decisions;
- integrations or external services;
- significant limitations or prerequisites.

The README update is part of the feature implementation, not a separate optional task.

### README update workflow

After implementing a new feature:

1. Inspect the relevant sections of `README.md`.
2. Determine whether the new behavior is already documented.
3. If documentation is missing or outdated, update `README.md`.
4. Keep the existing README structure and writing style.
5. Prefer concise documentation that explains the feature from the user's/developer's perspective.
6. Do not document implementation details that are irrelevant to users or contributors.
7. Do not rewrite unrelated sections of the README.
8. If the feature does not require a README change, explicitly state:
   `README.md: no update required.`

### Feature completion requirement

A feature must not be considered complete until:

- the implementation is complete;
- relevant tests/validation have been performed;
- `README.md` has been reviewed;
- required documentation has been updated.

When reporting the completed work, include:

```text
Documentation:
- README.md updated: <yes/no>
- Reason: <brief explanation>
```

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

### Phase 3 — Reuse check

Before creating new components, utilities, hooks, services, or abstractions:

1. Search the repository for existing implementations.
2. Identify reusable components and utilities.
3. Determine whether existing components can be extended.
4. Identify any duplicated logic that should instead be extracted.
5. State which existing components will be reused.
6. Only create new abstractions when existing ones are genuinely unsuitable.

Do not proceed with creating a duplicate implementation without a clear reason.

### Phase 4 — Implement

Implement one logical increment at a time.

Prefer composition and reuse over duplication.

Avoid unrelated refactoring.

### Phase 5 — Validate

Run the most relevant type checks, tests, builds, or endpoint checks.

Fix issues caused by the implementation.

### Phase 6 — Documentation

Review `README.md` and update it when the implemented feature changes documented application behavior, setup, configuration, architecture, integrations, or supported functionality.

Do not skip this step for new user-facing features.

### Phase 7 — Review

Inspect the final diff.

Look specifically for:
- unintended changes;
- duplicated logic;
- security issues;
- financial calculation errors;
- cross-platform problems;
- outdated README documentation.

### Phase 8 — Report

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

Reuse:
- Existing components reused: ...
- New components created: ...
- Reason new components were necessary: ...
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

- `financecloud-design-system`
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
