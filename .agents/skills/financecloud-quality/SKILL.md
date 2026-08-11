---
name: financecloud-quality
description: Use when reviewing, testing, debugging, refactoring, or validating FinanceCloud changes before they are considered complete.
---

# FinanceCloud Quality

## Goal

Catch regressions early while keeping validation proportional to the change.

## Standard workflow

After implementing a feature or fix:

1. Inspect the git diff.
2. Run TypeScript checking using the repository's configured command.
3. Run relevant tests if they exist.
4. Run the relevant Expo/Web build when the change affects build-time behavior.
5. For API changes, exercise the affected endpoint when local Vercel development is available.
6. Review for accidental secrets, unrelated changes, and dead code.
7. Summarize what was validated and what could not be validated.

## Review checklist

### Correctness
- Does the implementation satisfy the requested behavior?
- Are existing transaction/category behaviors preserved?
- Are loading, empty, error, and offline states handled?

### Type safety
- No unnecessary `any`.
- Shared interfaces are updated consistently.
- API and client types agree.

### Security
- No Turso credentials in client code.
- No secrets committed to source control.
- API input is validated.
- SQL remains parameterized.

### Cross-platform
- Web behavior remains valid.
- Android/iOS behavior remains valid.
- Platform-specific files are used appropriately.

### Performance
- Avoid unnecessary API calls.
- Avoid repeated exchange-rate requests within the 60-second cache window.
- Avoid expensive D3 calculations on every render.
- Avoid unnecessary list/screen re-renders.

### Maintainability
- Reuse existing services/components.
- Avoid duplicated business logic.
- Keep changes focused.

## Debugging procedure

When a bug is reported:
1. Reproduce or inspect the failure.
2. Identify the smallest likely root cause.
3. Make the smallest safe fix.
4. Validate the fix.
5. Check for regressions in the affected flow.
6. Do not perform unrelated refactors unless requested.
