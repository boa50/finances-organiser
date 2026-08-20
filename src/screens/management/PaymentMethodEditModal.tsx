import React from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PaymentMethodItem } from '../../types';
import { AppModal, AppText, AppSwitch } from '../../components/ui';
import { CreditCard } from 'lucide-react-native';
import theme, { useTheme } from '../../theme';

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
  const { theme } = useTheme();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={editingPm ? t('management.editPm') : t('management.newPm')}
      subtitle={editingPm ? t('management.editPmSubtitle') : t('management.newPmSubtitle')}
    >
      <View style={styles.modalBody}>
        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>{t('management.pmName')}</AppText>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceRecessed,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.borderLight,
              },
            ]}
            placeholder={t('management.pmNamePlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={pmNameInput}
            onChangeText={setPmNameInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>{t('management.allowInstallments')}</AppText>
          <Pressable
            style={({ pressed }) => [
              styles.toggleRow,
              {
                backgroundColor: pmAllowInstallments ? theme.colors.accentBg : theme.colors.surfaceRecessed,
                borderColor: pmAllowInstallments ? theme.colors.accent : theme.colors.borderLight,
              },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setPmAllowInstallments(!pmAllowInstallments)}
          >
            <View pointerEvents="none">
              <AppSwitch
                value={pmAllowInstallments}
                onValueChange={setPmAllowInstallments}
              />
            </View>
            <AppText style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>
              {pmAllowInstallments
                ? t('management.allowInstallmentsEnabled')
                : t('management.allowInstallmentsDisabled')}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>{t('management.preview')}</AppText>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: theme.colors.surfaceRecessed,
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.accentBg, borderColor: theme.colors.borderAccent }]}>
              <CreditCard size={22} color={theme.colors.accent} />
            </View>
            <AppText style={[styles.previewName, { color: theme.colors.textPrimary }]}>
              {pmNameInput.trim() || t('management.pmNameFallback')}
            </AppText>
          </View>
        </View>

        {pmErrorMsg && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.danger }]}>
            <AppText style={[styles.errorText, { color: theme.colors.danger }]}>{pmErrorMsg}</AppText>
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
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <AppText style={[styles.saveSubmitText, { color: theme.colors.white }]}>
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
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: theme.fontSize.base,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
  },
  toggleLabel: {
    flex: 1,
    fontSize: theme.fontSize.xs,
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
  errorBox: {
    borderRadius: theme.radii.base,
    padding: theme.spacing.md,
    borderWidth: 1,
  },
  errorText: {
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
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.extrabold,
  },
});
