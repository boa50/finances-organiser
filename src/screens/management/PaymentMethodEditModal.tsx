import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PaymentMethodItem } from '../../types';
import { AppBadge, AppButton, AppModal, AppSwitch, AppText, AppTextInput, FeedbackMessage } from '../../components/ui';
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
        {pmErrorMsg && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={pmErrorMsg} />
          </View>
        )}

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.pmName')}
          </AppText>
          <AppTextInput
            placeholder={t('management.pmNamePlaceholder')}
            value={pmNameInput}
            onChangeText={setPmNameInput}
            autoCapitalize="words"
          />
        </View>

        {/* Allow Installments Toggle Card */}
        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.allowInstallments')}
          </AppText>
          <View
            style={[
              styles.toggleCard,
              {
                backgroundColor: theme.colors.surfaceRecessed,
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <View style={styles.toggleCardText}>
              <AppText style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                {t('management.allowInstallments')}
              </AppText>
              <AppText style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                {pmAllowInstallments
                  ? t('management.allowInstallmentsEnabled')
                  : t('management.allowInstallmentsDisabled')}
              </AppText>
            </View>
            <AppSwitch
              value={pmAllowInstallments}
              onValueChange={setPmAllowInstallments}
            />
          </View>
        </View>

        {/* Live Preview Card */}
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
                {
                  backgroundColor: theme.colors.accentBg,
                  borderColor: theme.colors.borderAccent,
                },
              ]}
            >
              <CreditCard size={22} color={theme.colors.accent} />
            </View>
            <AppText style={[styles.previewName, { color: theme.colors.textPrimary }]}>
              {pmNameInput.trim() || t('management.pmNameFallback')}
            </AppText>
            {pmAllowInstallments && (
              <AppBadge
                variant="accent"
                label={t('management.allowInstallmentsEnabled')}
              />
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              variant="ghost"
              title={t('common.cancel')}
              onPress={onClose}
              disabled={pmSaving}
              fullWidth={false}
            />
          </View>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              variant="primary"
              title={editingPm ? t('management.saveChanges') : t('management.createPm')}
              onPress={onSave}
              disabled={pmSaving}
              loading={pmSaving}
              fullWidth={false}
            />
          </View>
        </View>
      </View>
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
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.input,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  toggleCardText: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  toggleTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  toggleSubtitle: {
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
