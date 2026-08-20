import React from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankItem } from '../../types';
import { AppModal, AppText } from '../../components/ui';
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
        <View style={styles.formGroup}>
          <AppText style={[styles.formLabel, { color: theme.colors.textSecondary }]}>{t('management.bankName')}</AppText>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceRecessed,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.borderLight,
              },
            ]}
            placeholder={t('management.bankNamePlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={bankNameInput}
            onChangeText={setBankNameInput}
            autoCapitalize="words"
          />
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
              <Building2 size={22} color={theme.colors.accent} />
            </View>
            <AppText style={[styles.previewName, { color: theme.colors.textPrimary }]}>
              {bankNameInput.trim() || t('management.bankNameFallback')}
            </AppText>
          </View>
        </View>

        {bankErrorMsg && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.danger }]}>
            <AppText style={[styles.errorText, { color: theme.colors.danger }]}>{bankErrorMsg}</AppText>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveSubmitBtn,
            { backgroundColor: theme.colors.accent },
            pressed && !bankSaving && { opacity: 0.85 },
          ]}
          onPress={onSave}
          disabled={bankSaving}
        >
          {bankSaving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <AppText style={[styles.saveSubmitText, { color: theme.colors.white }]}>
              {editingBank ? t('management.saveChanges') : t('management.createBank')}
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
