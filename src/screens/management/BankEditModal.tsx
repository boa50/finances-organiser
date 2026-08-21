import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankItem } from '../../types';
import { AppButton, AppModal, AppText, AppTextInput, FeedbackMessage } from '../../components/ui';
import { Building2 } from 'lucide-react-native';
import theme, { useTheme } from '../../theme';

interface BankEditModalProps {
  visible: boolean;
  onClose: () => void;
  editingBank: BankItem | null;
  bankNameInput: string;
  setBankNameInput: (val: string) => void;
  bankSaving: boolean;
  bankErrorMsg: string | null;
  onSave: () => void;
}

export const BankEditModal: React.FC<BankEditModalProps> = ({
  visible,
  onClose,
  editingBank,
  bankNameInput,
  setBankNameInput,
  bankSaving,
  bankErrorMsg,
  onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={editingBank ? t('management.editBank') : t('management.newBank')}
      subtitle={editingBank ? t('management.editBankSubtitle') : t('management.newBankSubtitle')}
    >
      <View style={styles.modalBody}>
        {bankErrorMsg && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={bankErrorMsg} />
          </View>
        )}

        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
            {t('management.bankName')}
          </AppText>
          <AppTextInput
            placeholder={t('management.bankNamePlaceholder')}
            value={bankNameInput}
            onChangeText={setBankNameInput}
            autoCapitalize="words"
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
                {
                  backgroundColor: theme.colors.accentBg,
                  borderColor: theme.colors.borderAccent,
                },
              ]}
            >
              <Building2 size={22} color={theme.colors.accent} />
            </View>
            <AppText style={[styles.previewName, { color: theme.colors.textPrimary }]}>
              {bankNameInput.trim() || t('management.bankNameFallback')}
            </AppText>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              variant="ghost"
              title={t('common.cancel')}
              onPress={onClose}
              disabled={bankSaving}
              fullWidth={false}
            />
          </View>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              variant="primary"
              title={editingBank ? t('management.saveChanges') : t('management.createBank')}
              onPress={onSave}
              disabled={bankSaving}
              loading={bankSaving}
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
