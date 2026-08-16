import React from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PaymentMethodItem } from '../../types';
import { AppModal, AppText, AppSwitch } from '../../components/ui';
import { CreditCard } from 'lucide-react-native';
import theme from '../../theme';

interface PaymentMethodEditModalProps {
  visible: boolean;
  onClose: () => void;
  editingPm: PaymentMethodItem | null;
  pmNameInput: string;
  setPmNameInput: (val: string) => void;
  pmAllowInstallments: boolean;
  setPmAllowInstallments: (val: boolean) => void;
  pmSaving: boolean;
  pmErrorMsg: string | null;
  onSave: () => void;
}

export const PaymentMethodEditModal: React.FC<PaymentMethodEditModalProps> = ({
  visible,
  onClose,
  editingPm,
  pmNameInput,
  setPmNameInput,
  pmAllowInstallments,
  setPmAllowInstallments,
  pmSaving,
  pmErrorMsg,
  onSave,
}) => {
  const { t } = useTranslation();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={editingPm ? t('management.editPm') : t('management.newPm')}
      subtitle={editingPm ? t('management.editPmSubtitle') : t('management.newPmSubtitle')}
    >
      <View style={styles.modalBody}>
        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>{t('management.pmName')}</AppText>
          <TextInput
            style={styles.textInput}
            placeholder={t('management.pmNamePlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={pmNameInput}
            onChangeText={setPmNameInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>{t('management.allowInstallments')}</AppText>
          <Pressable
            style={({ pressed }) => [
              styles.toggleRow,
              pmAllowInstallments && styles.toggleRowActive,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setPmAllowInstallments(!pmAllowInstallments)}
          >
            <AppSwitch
              value={pmAllowInstallments}
              onValueChange={setPmAllowInstallments}
            />
            <AppText style={styles.toggleLabel}>
              {pmAllowInstallments
                ? t('management.allowInstallmentsEnabled')
                : t('management.allowInstallmentsDisabled')}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>{t('management.preview')}</AppText>
          <View style={styles.previewBox}>
            <View style={[styles.iconBadge, { backgroundColor: `${theme.colors.accent}25`, borderColor: theme.colors.accent }]}>
              <CreditCard size={22} color={theme.colors.accent} />
            </View>
            <AppText style={styles.previewName}>{pmNameInput.trim() || t('management.pmNameFallback')}</AppText>
          </View>
        </View>

        {pmErrorMsg && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{pmErrorMsg}</AppText>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveSubmitBtn,
            { backgroundColor: theme.colors.accent },
            pressed && !pmSaving && { opacity: 0.85 },
          ]}
          onPress={onSave}
          disabled={pmSaving}
        >
          {pmSaving ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <AppText style={styles.saveSubmitText}>
              {editingPm ? t('management.saveChanges') : t('management.createPm')}
            </AppText>
          )}
        </Pressable>
      </View>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  toggleRowActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  toggleLabel: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
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
