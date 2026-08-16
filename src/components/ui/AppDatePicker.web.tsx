import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import theme from '../../theme';

export interface AppDatePickerProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  visible,
  value,
  onChange,
  onClose,
}) => {
  const { t } = useTranslation();

  const handleChange = (event: any) => {
    const selectedDate = new Date(`${event.target.value}T00:00:00`);
    if (!Number.isNaN(selectedDate.getTime())) onChange(selectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText style={styles.title}>{t('common.selectDate')}</AppText>
          {React.createElement('input', {
            type: 'date',
            value: value.toISOString().slice(0, 10),
            onChange: handleChange,
            style: browserDateInputStyle,
          })}
          <Pressable
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <AppText style={styles.doneText}>{t('common.done')}</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export const TransactionDatePicker = AppDatePicker;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['4xl'],
    backgroundColor: theme.colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['3xl'],
    padding: theme.spacing['4xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.extrabold,
    marginBottom: theme.spacing.xl,
  },
  doneButton: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  doneText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});

const browserDateInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: theme.colors.background,
  color: theme.colors.textPrimary,
  border: `1px solid ${theme.colors.borderLight}`,
  borderRadius: theme.radii.base,
  padding: theme.spacing.lg,
  fontSize: theme.fontSize.sm,
  fontFamily: theme.fontFamily.sans,
};
