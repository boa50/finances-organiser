import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { BankItem } from '../../types';
import { AppModal, AppText } from '../../components/ui';
import { Building2 } from 'lucide-react-native';
import theme from '../../theme';

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
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={editingBank ? 'Edit Bank' : 'New Bank'}
      subtitle={editingBank ? 'Rename this bank' : 'Add a new bank'}
    >
      <View style={styles.modalBody}>
        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>Bank Name</AppText>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Nubank, Itaú, Bradesco"
            placeholderTextColor={theme.colors.textTertiary}
            value={bankNameInput}
            onChangeText={setBankNameInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <AppText style={styles.formLabel}>Preview</AppText>
          <View style={styles.previewBox}>
            <View style={[styles.iconBadge, { backgroundColor: `${theme.colors.accent}25`, borderColor: theme.colors.accent }]}>
              <Building2 size={22} color={theme.colors.accent} />
            </View>
            <AppText style={styles.previewName}>{bankNameInput.trim() || 'Bank Name'}</AppText>
          </View>
        </View>

        {bankErrorMsg && (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{bankErrorMsg}</AppText>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveSubmitBtn, { backgroundColor: theme.colors.accent }]}
          onPress={onSave}
          disabled={bankSaving}
        >
          {bankSaving ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <AppText style={styles.saveSubmitText}>
              {editingBank ? 'Save Changes' : 'Create Bank'}
            </AppText>
          )}
        </TouchableOpacity>
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
