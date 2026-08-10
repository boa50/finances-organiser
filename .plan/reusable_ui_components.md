# Implementation Plan: Reusable UI Component System

## Executive Summary

FinanceCloud screens currently define large, repetitive `StyleSheet` blocks for common visual elements (cards, status pills, headers, empty states, icon containers, and tab selectors).

By extracting **6 flexible UI primitives** into `src/components/ui/` and standardizing component patterns across the app, we will:
1. **Reduce code duplication** across screens by 30-40%.
2. **Shrink `styles` objects** in major screens (`OverviewScreen`, `TransactionsScreen`, `AnalyticsScreen`, `ManagementScreen`).
3. **Ensure visual consistency** across Web, Android, and iOS using existing [`theme.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/theme.ts) design tokens.

---

## Existing vs. New UI Component Hierarchy

```
src/components/ui/
├── index.ts                   (barrel export)
├── AppTextInput.tsx           (existing - input primitive)
├── AppButton.tsx              (existing - button primitive)
├── FeedbackMessage.tsx        (existing - inline feedback primitive)
├── AppCard.tsx                [NEW] Surface container card
├── AppBadge.tsx               [NEW] Status pill / tag / currency badge
├── AppSectionHeader.tsx       [NEW] Section title + action header
├── AppIconBadge.tsx          [NEW] Icon container box with status bg
├── AppEmptyState.tsx          [NEW] Standard empty data state card
└── AppSegmentedControl.tsx    [NEW] Filter / tab switcher control
```

---

## Detailed Specifications for New UI Components

### 1. `AppCard` (`src/components/ui/AppCard.tsx`)

A standardized card container replacing repetitive background/border/shadow styles.

```typescript
interface AppCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: keyof typeof theme.spacing; // default: '4xl' (20px)
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}
```

- **Replaces duplicated styles in**:
  - `OverviewScreen`: `heroCard`, `section`, `emptyBox`
  - `TransactionsScreen`: `searchContainer`, `monthEntry`, `summaryBox`
  - `AnalyticsScreen`: `chartCard`, `summaryCard`
  - `ManagementScreen`: `sectionCard`, `categoryCard`

---

### 2. `AppBadge` (`src/components/ui/AppBadge.tsx`)

A pill/badge component for statuses, flags, counts, and tags.

```typescript
interface AppBadgeProps {
  label: string;
  icon?: React.ReactNode;
  statusDot?: boolean;
  variant?: 'success' | 'danger' | 'warning' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}
```

- **Replaces duplicated styles in**:
  - `App.tsx`: `tursoStatusBtn`
  - `OverviewScreen`: `tursoPill`
  - `TransactionsScreen`: `currencyBadge`
  - `ManagementScreen`: Category/bank/payment badges

---

### 3. `AppSectionHeader` (`src/components/ui/AppSectionHeader.tsx`)

Unified section header with title, subtitle, and action button ("See all →", "+ Add", etc.).

```typescript
interface AppSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
```

- **Replaces duplicated styles in**:
  - `OverviewScreen`: `header`, `sectionHeader`
  - `TransactionsScreen`: `monthHeader`, section headers
  - `AnalyticsScreen`: Screen title block & chart headers
  - `ManagementScreen`: Section title blocks

---

### 4. `AppIconBadge` (`src/components/ui/AppIconBadge.tsx`)

A circular or rounded box for icons with background status tinting (`successBg`, `dangerBg`, `accentBg`).

```typescript
interface AppIconBadgeProps {
  icon: React.ReactNode;
  variant?: 'success' | 'danger' | 'accent' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg'; // 32px, 40px, 48px
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}
```

- **Replaces duplicated styles in**:
  - `OverviewScreen`: `recentIcon`
  - `TransactionsScreen`: `typeIconBox`
  - `LoginScreen`: `brandBadge`
  - `ManagementScreen`: Category/bank icon containers

---

### 5. `AppEmptyState` (`src/components/ui/AppEmptyState.tsx`)

Standard empty data state card with optional icon, title, description, and action button.

```typescript
interface AppEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}
```

- **Replaces duplicated styles in**:
  - `OverviewScreen`: `emptyBox`, `emptyText`
  - `TransactionsScreen`: Empty search/list state
  - `AnalyticsScreen`: Empty chart placeholder
  - `ManagementScreen`: Empty items view

---

### 6. `AppSegmentedControl` (`src/components/ui/AppSegmentedControl.tsx`)

Tab switcher control for filtering lists or toggling screen sections.

```typescript
export interface SegmentedControlOption<T extends string = string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface AppSegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}
```

- **Replaces duplicated styles in**:
  - `TransactionsScreen`: Filter type tabs ('All' | 'Income' | 'Expense')
  - `ManagementScreen`: Section navigation tabs
  - `TransactionEditModal`: Type selector ('Expense' vs 'Income')

---

## Screen-by-Screen Refactoring Plan

| Screen / Component | Existing `StyleSheet` Size | Major Style Reductions | Reusable UI Components Used |
|--------------------|----------------------------|------------------------|-----------------------------|
| `OverviewScreen` | ~160 lines | Hero card, turso pill, section headers, recent item icon boxes | `AppCard`, `AppBadge`, `AppSectionHeader`, `AppIconBadge`, `AppEmptyState` |
| `TransactionsScreen` | ~200 lines | Search box container, filter tabs, month entries, type icon boxes, currency badges | `AppCard`, `AppBadge`, `AppSectionHeader`, `AppIconBadge`, `AppSegmentedControl`, `AppTextInput` |
| `AnalyticsScreen` | ~120 lines | Section headers, card wrappers, empty data states | `AppCard`, `AppSectionHeader`, `AppEmptyState`, `AppSegmentedControl` |
| `ManagementScreen` | ~400 lines | Section tab bar, card items, modal headers, item icon badges | `AppCard`, `AppBadge`, `AppSectionHeader`, `AppIconBadge`, `AppSegmentedControl`, `AppButton` |
| `App.tsx` | ~140 lines | Top bar status pill | `AppBadge` |

---

## Implementation Steps

1. **Step 1: Create New UI Primitives**
   - Implement `AppCard.tsx`, `AppBadge.tsx`, `AppSectionHeader.tsx`, `AppIconBadge.tsx`, `AppEmptyState.tsx`, and `AppSegmentedControl.tsx` under `src/components/ui/`.
   - Update `src/components/ui/index.ts` barrel export.

2. **Step 2: Refactor `OverviewScreen.tsx`**
   - Replace custom card, header, badge, icon box, and empty state JSX with new primitives.
   - Clean up redundant `StyleSheet` rules.

3. **Step 3: Refactor `TransactionsScreen.tsx`**
   - Replace search container, month header, filter tabs, transaction row icon boxes, and currency badges with new primitives.
   - Clean up redundant `StyleSheet` rules.

4. **Step 4: Refactor `AnalyticsScreen.tsx` & `ManagementScreen.tsx`**
   - Adopt `AppCard`, `AppSectionHeader`, `AppSegmentedControl`, and `AppEmptyState`.
   - Clean up redundant `StyleSheet` rules.

5. **Step 5: Refactor `App.tsx` Top Bar**
   - Replace custom `tursoStatusBtn` with `AppBadge`.

6. **Step 6: Comprehensive Validation**
   - Run `npx tsc --noEmit` to verify type safety.
   - Run `npm test` to verify all 31 unit tests pass without regression.

---

## Risk Mitigation & Design Integrity

- **Zero Design Change**: Visual appearance, colors, spacing, and animations remain identical.
- **Cross-Platform Compatibility**: All primitives use standard Expo/React Native `View`, `Text`, `TouchableOpacity` elements with `theme.ts` design tokens.
- **Backwards Compatibility**: Existing component props and callbacks remain unchanged.
