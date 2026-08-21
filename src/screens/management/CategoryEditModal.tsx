import React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryItem, TransactionType } from '../../types';
import {
  AVAILABLE_CATEGORY_ICONS,
  PRESET_CATEGORY_COLORS,
} from '../../services/categoryService';
import { CategoryIcon } from '../../components/CategoryIcon';
import { AppButton, AppChipSelector, AppModal, AppText, AppTextInput, FeedbackMessage } from '../../components/ui';
import theme, { useTheme } from '../../theme';

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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const typeLabel = activeCategoryType === 'income' ? t('common.income') : t('common.expense');

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={
        editingCategory
          ? t('management.editCategory')
          : t('management.newCategoryModalTitle', { type: typeLabel })
      }
      subtitle={t('management.categoryModalSubtitle')}
    >
      <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
        {errorMsg && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={errorMsg} />
          </View>
        )}

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.categoryName')}
          </AppText>
          <AppTextInput
            placeholder={t('management.categoryNamePlaceholder')}
            value={nameInput}
            onChangeText={setNameInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.colorTheme')}
          </AppText>
          <View style={styles.colorGrid}>
            {PRESET_CATEGORY_COLORS.map((c) => {
              const isSelected = colorInput === c;
              return (
                <Pressable
                  key={c}
                  style={({ pressed }) => [
                    styles.colorDot,
                    { backgroundColor: c },
                    isSelected && [
                      styles.colorDotSelected,
                      { borderColor: theme.colors.textPrimary },
                    ],
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setColorInput(c)}
                  accessibilityLabel={`Color ${c}`}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.iconBadge')}
          </AppText>
          <AppChipSelector
            items={AVAILABLE_CATEGORY_ICONS}
            selectedId={iconInput}
            onSelect={(item) => setIconInput(item.iconName)}
            keyExtractor={(item) => item.iconName}
            labelExtractor={(item) => item.label}
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
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.preview')}
          </AppText>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: theme.colors.surfaceRecessed,
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${colorInput}25`, borderColor: colorInput },
              ]}
            >
              <CategoryIcon iconName={iconInput} color={colorInput} size={22} />
            </View>
            <AppText style={[styles.previewName, { color: theme.colors.textPrimary }]}>
              {nameInput.trim() || t('management.categoryNameFallback')}
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
                {typeLabel.toUpperCase()}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              variant="ghost"
              title={t('common.cancel')}
              onPress={onClose}
              disabled={saving}
              fullWidth={false}
            />
          </View>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              variant="primary"
              title={editingCategory ? t('management.saveCategory') : t('management.createCategory')}
              onPress={onSave}
              disabled={saving}
              loading={saving}
              fullWidth={false}
            />
          </View>
        </View>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  errorContainer: {
    marginBottom: theme.spacing.xs,
  },
  formGroup: {
    gap: theme.spacing.xs,
  },
  formLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
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
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionBtnWrapper: {
    minWidth: 110,
  },
});
