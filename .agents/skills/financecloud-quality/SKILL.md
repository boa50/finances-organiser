---
name: financecloud-quality
description: Use when reviewing, testing, debugging, refactoring, or validating FinanceCloud changes before they are considered complete.
---

# FinanceCloud Quality & Review

## Goal

Catch regressions early, maintain test coverage, and enforce strict adherence to the design system, UI primitive standardization, and architectural boundaries.

---

## Standard Validation Workflow

After implementing any feature or fix:

1. **Inspect the git diff**: `git diff` — confirm no accidental file changes, unintended reformatting, or committed secrets.
2. **Type check**: Run TypeScript validation (`npx tsc --noEmit`).
3. **Unit tests**: Run Jest suite (`npm test`).
4. **Web build check**: Run `npx expo export -p web` when modifying bundler config, platform-specific files, or dependencies.
5. **API check**: For API modifications, test endpoints with `npx vercel dev` when practical.
6. **Documentation check**: Review `README.md` and update if user workflows, configs, or features changed.

---

## Quality Review Checklist

### 1. Design System & UI Reusability Audit
- [ ] **No raw `<Text>`**: All textual elements wrap `<AppText variant="...">` with `src/theme.ts` typography tokens.
- [ ] **No raw `<Modal>`**: All modal dialogues and forms use `<AppModal>`.
- [ ] **No custom icon pressables**: Icon action buttons in cards and list rows use `<AppIconButton>`.
- [ ] **No raw `<Switch>`**: Boolean switches use `<AppSwitch>`.
- [ ] **No raw `<ActivityIndicator>`**: Loading states render `<AppLoadingView>`.
- [ ] **No raw chip loops**: Horizontal selection groups use `<AppChipSelector>`.
- [ ] **No duplicate card layouts**: Management items use `<EntityManagementCard>`.
- [ ] **No hardcoded styles**: Colors, spacing, radii, and font sizes reference `theme.*` exclusively.
- [ ] **No raw `window.confirm` / `Alert.alert`**: Confirmations use `confirmAction` from `src/utils/dialogs.ts`.

### 2. Financial Correctness
- [ ] Income and expense sign semantics are respected.
- [ ] Currency conversion passes through BRL pivot exactly once.
- [ ] Presentation formatting uses `formatMoney()` rather than raw arithmetic strings.
- [ ] Zero-data, single-data-point, and negative balance states are handled gracefully without `NaN`/`Infinity`.

### 3. Type Safety & Maintainability
- [ ] No unwarranted `any` types.
- [ ] Data structures utilize centralized interfaces from `src/types/index.ts`.
- [ ] Logic is placed in services (`src/services/`) and hooks (`src/hooks/`), not embedded inside UI renderers.
- [ ] Shared persistence uses `localStorageHelper.ts`.

### 4. Security & API Isolation
- [ ] Zero Turso credentials or database clients in client-side code.
- [ ] No `.env` secrets or production keys in version control.
- [ ] API routes validate HTTP methods and parameters with parameterized SQL queries.

### 5. Cross-Platform Validation
- [ ] Web layout functions seamlessly on desktop viewports.
- [ ] Touch targets and mobile modal sheets function properly (<600px).
- [ ] Date picking uses `AppDatePicker` across native and web.

---

## Debugging Procedure

When resolving an issue:
1. Reproduce and identify the root cause.
2. Formulate the smallest safe, reversible fix.
3. Reuse existing UI primitives and service methods.
4. Execute `npm test` and `npx tsc --noEmit` to verify zero regressions.
