---
name: financecloud-design-system
description: Use when creating or modifying UI components, styling, design tokens, UI primitives, modal dialogs, form inputs, buttons, cards, list items, charts, or verifying design system standardization and reusability.
---

# FinanceCloud Design System & Component Standardization

## Goal

Maintain a unified, premium, and reusable design system across Web, Android, and iOS by enforcing strict component standardization, token-driven styling (`src/theme.ts`), and zero duplication of UI primitives and domain components.

---

## 1. 3-Tier Component Architecture

FinanceCloud organizes UI components into three distinct tiers:

```text
src/
├── components/
│   ├── ui/             # Tier 1: Atomic UI Primitives (domain-agnostic, single responsibility)
│   ├── management/     # Tier 2: Domain-Level Composite Components
│   ├── charts/         # Tier 2: Modular D3 + SVG Chart Components
│   ├── analytics/      # Tier 2: Aggregated Analytics Cards & Breakdown Widgets
│   ├── overview/       # Tier 2: Overview Screen Summary Widgets
│   ├── transactions/   # Tier 2: Transaction Cards & Modals
│   ├── subscriptions/  # Tier 2: Subscription Modals & Controls
│   ├── AppHeader.tsx   # Tier 3: Common App Layout & Header
│   ├── AppTabBar.tsx   # Tier 3: Bottom Navigation Bar
│   └── CategoryIcon.tsx# Tier 3: Dynamic Category Icon Renderer
└── screens/            # Tier 3: Feature Screens & Modal Lifecycle Managers
```

---

## 2. Design Tokens (`src/theme.ts`)

All styling **MUST** consume tokens from `src/theme.ts`. Never hardcode raw hex colors, raw pixel spacing, font sizes, or border radii.

### Token Overview
- **`theme.colors`**: `background`, `surface`, `surfaceElevated`, `surfaceGlass`, `surfaceRecessed`, `surfaceSubtle`, `textPrimary`, `textSecondary`, `textTertiary`, `textMuted`, `border`, `borderLight`, `borderSubtle`, `borderAccent`, `accent`, `accentBg`, `success`, `successBg`, `danger`, `dangerBg`, `warning`, `warningBg`, `overlay`.
- **`theme.spacing`**: `xxs` (2), `xs` (4), `sm` (6), `md` (8), `base` (10), `lg` (12), `xl` (14), `2xl` (16), `3xl` (18), `4xl` (20), `5xl` (22), `6xl` (24), `6.5xl` (32), `7xl` (40).
- **`theme.radii`**: `sm` (6), `md` (8), `base` (10), `lg` (12), `xl` (14), `2xl` (16), `card` (20), `modal` (24), `button` (14), `input` (14), `pill` (999).
- **`theme.fontSize`**: `xs` (11), `sm` (12), `base` (13), `md` (14), `lg` (15), `xl` (16), `2xl` (18), `3xl` (24), `4xl` (34), `5xl` (40).
- **`theme.fontWeight`**: `regular` ('400'), `medium` ('500'), `semibold` ('600'), `bold` ('700'), `extrabold` ('800'), `black` ('900').
- **`theme.typography`**: Standard presets (`h1`, `h2`, `h3`, `h4`, `subtitle`, `body`, `bodyMedium`, `caption`, `badge`, `button`, `heroValue`, `kpiValue`, `metaLabel`).

---

## 3. Tier 1: Core UI Primitives (`src/components/ui/`)

All primitives are exported via `src/components/ui/index.ts`.

| Component | Responsibility & Key Props | Mandatory Use Case |
| :--- | :--- | :--- |
| **`AppText`** | Enforces font family and standard typography variants.<br>`variant?: keyof typeof theme.typography`, `style?: StyleProp<TextStyle>` | All typography throughout the app. Never use raw React Native `<Text>`. |
| **`AppTextInput`** | Styled text input with error state, clear button, and prefix/suffix icon slots.<br>`label?: string`, `error?: string`, `icon?: ReactNode`, `onClear?: () => void` | All form inputs (titles, search, amounts, numbers). |
| **`AppButton`** | Standard variant button with loading spinner.<br>`variant?: 'primary' \| 'secondary' \| 'outline' \| 'danger' \| 'ghost'`, `loading?: boolean`, `icon?: ReactNode` | All major modal/screen primary and secondary action triggers. |
| **`AppIconButton`** | Standardized compact icon action button matching card design.<br>`variant?: 'edit' \| 'delete' \| 'duplicate' \| 'custom'`, `size?: 'sm' \| 'md' \| 'lg'`, `icon?: ReactNode` | All icon action buttons in list item cards and table rows. Never use raw `<Pressable>` with an icon. |
| **`AppCard`** | Standard surface container.<br>`variant?: 'default' \| 'elevated' \| 'outlined' \| 'glass'`, `padding?: keyof typeof theme.spacing`, `onPress?: () => void` | All card containers, summaries, and list items. |
| **`AppBadge`** | Status tag pill with optional status dot.<br>`variant?: 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral' \| 'accent'`, `label: string`, `showDot?: boolean` | Status indicators, entity counts, type indicators. |
| **`AppIconBadge`** | Rounded icon container with semantic tint background.<br>`icon: ReactNode`, `size?: number`, `backgroundColor?: string` | Leading icon wrappers in list item cards. |
| **`AppSectionHeader`** | Section header container with title, subtitle, and right action slot.<br>`title: string`, `subtitle?: string`, `rightAction?: ReactNode` | Screen sections, list headers, and chart headers. |
| **`AppSegmentedControl`** | Segmented tab filter control.<br>`options: SegmentedControlOption[]`, `selectedId: string`, `onSelect: (id: string) => void` | Tab filters, time range pickers (1M, 3M, 6M, 1Y), income/expense switches. |
| **`AppEmptyState`** | Empty data view with icon, title, description, and action button.<br>`icon: ReactNode`, `title: string`, `description?: string`, `actionLabel?: string`, `onAction?: () => void` | Empty list states, search results with no matches. |
| **`AppLoadingView`** | Standardized loading spinner with message.<br>`message?: string`, `style?: StyleProp<ViewStyle>` | Screen loading states and asynchronous data loading views. |
| **`AppModal`** | Standard modal container with backdrop, header, title, mobile drag handle, and close button.<br>`visible: boolean`, `onClose: () => void`, `title?: string`, `subtitle?: string`, `maxWidth?: number` | All modal forms and dialogs. Never use raw `<Modal>`. |
| **`AppSwitch`** | Standardized custom animated toggle switch.<br>`value: boolean`, `onValueChange: (val: boolean) => void`, `size?: 'sm' \| 'md'` | Entity active toggles, boolean form fields. Never use raw `<Switch>`. |
| **`AppChipSelector`** | Standard horizontal chip selection list.<br>`options: { id: string; label: string; icon?: ReactNode }[]`, `selectedId?: string`, `onSelect: (id: string) => void` | Category selection, payment method selection, bank selection in forms. |
| **`AppDatePicker`** | Platform-adaptive date picker (`.native.tsx` / `.web.tsx`).<br>`value: string`, `onChange: (dateStr: string) => void` | All date inputs across forms and modals. |
| **`AppDraggableList`** | Drag-and-drop reorderable list for entity management.<br>`data: T[]`, `onReorder: (newData: T[]) => void`, `renderItem: (info: RenderDraggableItemInfo<T>) => ReactNode` | Reordering items in Categories, Payment Methods, Banks, Currencies. |
| **`FeedbackMessage`** | Toast / banner alert notification.<br>`type: 'success' \| 'error' \| 'info'`, `message: string`, `onDismiss?: () => void` | Inline feedback and toast notifications. |

---

## 4. Tier 2: Domain-Level Reusable Components

| Component Location | Name | Responsibility |
| :--- | :--- | :--- |
| `src/components/management/` | **`EntityManagementCard`** | Reusable row card for Categories, Payment Methods, Banks, and Currencies. Provides drag handle, icon badge, name, subtitle, active switch, and edit/delete `AppIconButton` actions. |
| `src/components/charts/` | **`IncomeExpenseDonutChart`** | D3 donut visualization comparing income vs expense with legend and center balance. |
| `src/components/charts/` | **`CategorySpendingBarChart`** | D3 horizontal bar visualization showing top spending categories with percentages and amounts. |
| `src/components/charts/` | **`EvolutionTrendChart`** | D3 multi-month line/area evolution chart with time-period filters. |
| `src/components/analytics/` | **`MonthlyBreakdownCharts`** | Assembles section header, donut chart, and category spending chart for a selected month. |
| `src/components/analytics/` | **`MonthDetailSummaryCard`** | Summary card showing net balance, total income, total expenses, and transaction counts for a selected month. |
| `src/components/overview/` | **`NetBalanceHeroCard`** | Hero balance overview card displaying net balance, 60-day trend, monthly income, and monthly expense metrics. |
| `src/components/transactions/`| **`TransactionItemCard`** | Transaction row item showing amount, converted BRL value, date, category icon, bank, payment method, installment indicator, and edit/delete/duplicate action buttons. |
| `src/components/transactions/`| **`TransactionEditModal`** | Transaction creation and editing modal form. |
| `src/components/subscriptions/`| **`SubscriptionEditModal`**| Recurring subscription creation and editing modal form. |

---

## 5. Component Standardization & Anti-Pattern Matrix

| Use Case | Mandatory Component | Forbidden Anti-Pattern |
| :--- | :--- | :--- |
| **Modal Dialogs / Forms** | `<AppModal visible={...} onClose={...} title="...">` | Custom `<Modal>` with manual backdrop and close buttons |
| **Action Buttons in Cards** | `<AppIconButton variant="edit"\|"delete"\|"duplicate" onPress={...} accessibilityLabel="...">` | Custom `<Pressable>` wrapping a Lucide icon |
| **Form Toggle Switches** | `<AppSwitch value={...} onValueChange={...} size="sm"\|"md">` | Custom toggle containers or raw React Native `<Switch>` |
| **Option / Tag Pill Selectors** | `<AppChipSelector options={...} selectedId={...} onSelect={...}>` | Inline `ScrollView` mapping custom `Pressable` pills |
| **Date Selection** | `<AppDatePicker value={...} onChange={...}>` | Inline date text inputs or unstandardized date pickers |
| **Screen / Asynchronous Loading**| `<AppLoadingView message="...">` | Standalone `<ActivityIndicator>` with raw `<Text>` |
| **Entity Management Items** | `<EntityManagementCard name={...} onEdit={...} onDelete={...}>` | Recreating custom card layouts for each management tab |
| **Typography & Text** | `<AppText variant="...">` | Raw React Native `<Text>` with hardcoded font styling |
| **Destructive Confirmations** | `confirmAction({ title, message, onConfirm, destructive: true })` | Inline `window.confirm` or direct `Alert.alert` calls |
| **Vector Icons** | `<CategoryIcon iconName={...} color={...}>` or Lucide icons | Raw Unicode emojis for icons (flags for currency codes are the only allowed emojis) |

---

## 6. Canonical Implementation Recipes

### Recipe A: Standard Modal Form Pattern
```tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppModal, AppTextInput, AppSwitch, AppButton, AppChipSelector } from '../ui';
import theme from '../../theme';

export interface EntityEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: EntityFormData) => Promise<void>;
  initialData?: EntityFormData;
}

export const EntityEditModal: React.FC<EntityEditModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({ name, enabled });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Edit Item' : 'New Item'}
    >
      <ScrollView style={styles.content}>
        <AppTextInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
        />
        <View style={styles.switchRow}>
          <AppText variant="body">Active</AppText>
          <AppSwitch value={enabled} onValueChange={setEnabled} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <AppButton variant="ghost" title="Cancel" onPress={onClose} />
        <AppButton variant="primary" title="Save" onPress={handleSubmit} loading={isSubmitting} />
      </View>
    </AppModal>
  );
};
```

### Recipe B: Standard Management Entity Tab
```tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppSectionHeader, AppButton, AppEmptyState, AppDraggableList } from '../../components/ui';
import { EntityManagementCard } from '../../components/management/EntityManagementCard';
import { confirmAction } from '../../utils/dialogs';

export const EntityManagementTab: React.FC = () => {
  // Use AppDraggableList with EntityManagementCard items
  // Use confirmAction for deletions
  // Open EntityEditModal for creation and editing
};
```
