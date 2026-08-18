---
name: financecloud-react-native
description: Use when building or modifying FinanceCloud screens, components, forms, navigation, platform-specific behavior, responsive layouts, or Expo/React Native UI for Web, Android, and iOS.
---

# FinanceCloud React Native / Expo

## Goal

Implement UI that behaves consistently and fluidly across Web, Android, and iOS while strictly respecting the 3-tier component architecture, design tokens (`src/theme.ts`), and standardized UI primitives (`src/components/ui/`).

---

## Project Conventions & Structure

- Feature screens are located in `src/screens/` (including `src/screens/management/`).
- Design system primitives are in `src/components/ui/`.
- Domain composite components are in `src/components/{management,charts,analytics,overview,transactions,subscriptions}/`.
- Common app layout elements are in `src/components/` (`AppHeader`, `AppTabBar`, `CategoryIcon`).
- Root navigation and shared tab state flow live in `App.tsx`.
- Date picking uses `AppDatePicker.native.tsx` (native modal) and `AppDatePicker.web.tsx` (web modal).
- Confirmations and destructive dialogs use `confirmAction` from `src/utils/dialogs.ts`.

---

## Component Standardization & Anti-Pattern Matrix

Always consult the **`financecloud-design-system`** skill for full prop definitions, component signatures, and canonical recipes.

| UI Requirement | Mandatory Component | Forbidden Anti-Pattern |
| :--- | :--- | :--- |
| **Typography & Text** | `<AppText variant="...">` | Raw React Native `<Text>` with inline styling |
| **Form Inputs** | `<AppTextInput label="..." value="..." onChangeText={...}>` | Raw React Native `<TextInput>` |
| **Action Buttons** | `<AppButton variant="primary"|"secondary"|"outline" title="...">` | Custom `<Pressable>` or `<TouchableOpacity>` |
| **Icon Action Buttons** | `<AppIconButton variant="edit"|"delete"|"duplicate" onPress={...}>` | Custom `<Pressable>` wrapping a Lucide icon |
| **Modals & Dialogs** | `<AppModal visible={...} onClose={...} title="...">` | Raw `<Modal>` with custom backdrop and close button |
| **Toggle Switches** | `<AppSwitch value={...} onValueChange={...}>` | Custom toggle containers or raw React Native `<Switch>` |
| **Chip / Pill Selectors** | `<AppChipSelector options={...} selectedId={...} onSelect={...}>` | Inline `ScrollView` mapping custom `Pressable` pills |
| **Date Selection** | `<AppDatePicker value={...} onChange={...}>` | Inline date text inputs or raw platform pickers |
| **Loading Views** | `<AppLoadingView message="...">` | Standalone `<ActivityIndicator>` with raw text |
| **Reorderable Lists** | `<AppDraggableList data={...} onReorder={...} renderItem={...}>` | Ad-hoc drag responder implementations |
| **Management Items** | `<EntityManagementCard name={...} onEdit={...} onDelete={...}>` | Recreating custom card layouts for each management tab |
| **Destructive Actions** | `confirmAction({ title, message, onConfirm, destructive: true })` | Inline `window.confirm` or raw `Alert.alert` calls |

---

## Implementation Rules

1. **Inspect before creating**: Search `src/components/ui/` and `src/components/` before writing any new component.
2. **Never duplicate existing primitives**: If a component needs minor styling adjustments, extend its props rather than creating a duplicate component.
3. **Use design tokens**: Always use `theme.colors`, `theme.spacing`, `theme.radii`, `theme.fontSize`, and `theme.typography` from `src/theme.ts`.
4. **Interactive accessibility**: Provide `accessibilityLabel` and `accessibilityRole` on all pressable controls.
5. **State handling**: Explicitly handle loading (`AppLoadingView`), empty (`AppEmptyState`), and error (`FeedbackMessage`) states in every screen.
6. **Controlled forms**: Keep form state controlled and validate inputs before submitting to services.
7. **Cross-platform responsiveness**: Verify narrow mobile widths (<600px) and wide desktop layouts. Use `.native.tsx` and `.web.tsx` only when behavior genuinely diverges between platforms.
8. **Performance**: Avoid inline function re-instantiation in list renderers; memoize heavy charts and complex calculations.

---

## Validation

After meaningful UI changes:
- Run TypeScript checks: `npx tsc --noEmit`.
- Run unit tests: `npm test`.
- Run Expo web build: `npx expo export -p web` when build-level changes are made.
- Test both narrow mobile and wide desktop viewports.
