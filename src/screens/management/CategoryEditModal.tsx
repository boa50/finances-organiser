import React from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { CategoryItem, TransactionType } from '../../types';
import {
  AVAILABLE_CATEGORY_ICONS,
  PRESET_CATEGORY_COLORS,
} from '../../services/categoryService';
import { CategoryIcon } from '../../components/CategoryIcon';
import { ChipSelector } from '../../components/ChipSelector';
import { AppModal, AppText } from '../../components/ui';
import theme from '../../theme';

interface CategoryEditModalProps {
  visible: boolean;
  onClose: () => void;
  editingCategory: CategoryItem | null;
  activeCategoryType: TransactionType;
  nameInput: string;
  setNameInput: (val: string) => void;
  colorInput: string;
  setColorInput: (val: string) => void;
  iconInput: string;
  setIconInput: (val: string) => void;
  saving: boolean;
  errorMsg: string | null;
  onSave: () => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  visible,
  onClose,
  editingCategory,
  activeCategoryType,
  nameInput,
  setNameInput,
  colorInput,
  setColorInput,
  iconInput,
  setIconInput,
  saving,
  errorMsg,
  onSave,
}) => {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : `New ${activeCategoryType === 'income' ? 'Income' : 'Expense'} Category`}
      subtitle="Choose a title, custom color accent, and icon badge"
    >
      <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>Category Name</AppText>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Subscriptions, Pet Care, Bonuses"
            placeholderTextColor={theme.colors.textTertiary}
            value={nameInput}
            onChangeText={setNameInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>Color Theme</AppText>
          <View style={styles.colorGrid}>
            {PRESET_CATEGORY_COLORS.map((c) => (
              <Pressable
                key={c}
                style={({ pressed }) => [
                  styles.colorDot,
                  { backgroundColor: c },
                  colorInput === c && styles.colorDotSelected,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setColorInput(c)}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>Icon Badge</AppText>
          <ChipSelector
            items={AVAILABLE_CATEGORY_ICONS}
            selectedId={iconInput}
            isSelected={(item) => item.iconName === iconInput}
            onSelect={(item) => setIconInput(item.iconName)}
            keyExtractor={(item) => item.id}
            labelExtractor={(item) => item.label}
            getItemColor={() => colorInput}
            renderIcon={(item, active) => (
              <CategoryIcon
                iconName={item.iconName}
                color={active ? colorInput : theme.colors.textSecondary}
                size={16}
              />
            )}
          />
        </View>

        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>Preview</AppText>
          <View style={styles.previewBox}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${colorInput}25`, borderColor: colorInput },
              ]}
            >
              <CategoryIcon iconName={iconInput} color={colorInput} size={22} />
            </View>
            <AppText style={styles.previewName}>
              {nameInput.trim() || 'Category Name'}
            </AppText>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    activeCategoryType === 'income' ? theme.colors.successBg : theme.colors.dangerBg,
                },
              ]}
            >
              <AppText
                style={{
                  color:
                    activeCategoryType === 'income' ? theme.colors.success : theme.colors.danger,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {activeCategoryType.toUpperCase()}
              </AppText>
            </View>
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{errorMsg}</AppText>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveSubmitBtn,
            {
              backgroundColor:
                activeCategoryType === 'income' ? theme.colors.success : theme.colors.accent,
            },
            pressed && !saving && { opacity: 0.85 },
          ]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <AppText style={styles.saveSubmitText}>
              {editingCategory ? 'Save Category' : 'Create Category'}
            </AppText>
          )}
        </Pressable>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  formGroup: {
    gap: theme.spacing.xs,
  },
  formLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: theme.colors.textPrimary,
    transform: [{ scale: 1.1 }],
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  previewName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: theme.radii.base,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  saveSubmitBtn: {
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  saveSubmitText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.extrabold,
  },
});
