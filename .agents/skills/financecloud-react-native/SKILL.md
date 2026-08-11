---
name: financecloud-react-native
description: Use when building or modifying FinanceCloud screens, components, forms, navigation, platform-specific behavior, responsive layouts, or Expo/React Native UI for Web, Android, and iOS.
---

# FinanceCloud React Native / Expo

## Goal

Implement UI that behaves consistently across Web, Android, and iOS while respecting the existing FinanceCloud component structure.

## Project conventions

- Screens are in `src/screens/`.
- Reusable UI is in `src/components/`.
- `App.tsx` currently provides the tab navigation and shared state flow.
- Date picking uses:
  - `TransactionDatePicker.native.tsx` for iOS/Android.
  - `TransactionDatePicker.web.tsx` for Web.
- Prefer existing components before creating new ones.
- Keep business/data logic in services rather than embedding database operations in UI components.

## Implementation rules

1. Inspect the existing screen and nearby components before editing.
2. Preserve existing visual language unless a redesign is requested.
3. Make interactive controls usable on touch devices and mouse/keyboard on Web.
4. Handle loading, empty, error, and disabled states explicitly.
5. Keep forms controlled and validate user input before persistence.
6. Use TypeScript types instead of `any`.
7. Avoid unnecessary re-renders in chart-heavy or list-heavy screens.
8. For platform differences, prefer `.native.tsx` / `.web.tsx` when the behavior is genuinely platform-specific.
9. Do not add a dependency when the existing Expo/React Native stack can solve the problem cleanly.

## Finance-specific UX

- Monetary values must use the selected currency formatting rules.
- Transaction forms must clearly distinguish income and expense.
- Categories must preserve their icon and color metadata.
- Dates must remain consistent across Web and native platforms.
- Destructive actions such as deleting transactions/categories should require an intentional user action.

## Validation

After meaningful UI changes:
- Run TypeScript checking if available.
- Run the Expo/web build when appropriate.
- Test the affected screen on the relevant platform(s).
- Check both narrow/mobile and wider/web layouts when the change is responsive.
