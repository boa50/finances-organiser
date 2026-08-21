import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import theme, { useTheme } from '../../theme';
import { formatDateToYMD, parseTransactionDate } from '../../utils/financials';

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
  const { theme } = useTheme();

  const handleChange = (event: any) => {
    const val = event.target?.value;
    if (val) {
      const selectedDate = parseTransactionDate(val);
      if (!Number.isNaN(selectedDate.getTime())) onChange(selectedDate);
    }
  };

  const browserDateInputStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    backgroundColor: theme.colors.surfaceRecessed,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.borderLight}`,
    borderRadius: theme.radii.input,
    padding: theme.spacing.xl,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fontFamily.sans,
    colorScheme: theme.isDark ? 'dark' : 'light',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderLight,
              boxShadow: theme.colors.cardShadow,
            },
          ]}
        >
          <AppText style={[styles.title, { color: theme.colors.textPrimary }]}>
            {t('common.selectDate')}
          </AppText>
          {React.createElement('input', {
            type: 'date',
            value: formatDateToYMD(value),
            onChange: handleChange,
            style: browserDateInputStyle,
          })}
          <View style={styles.actions}>
            <AppButton
              variant="primary"
              title={t('common.done')}
              onPress={onClose}
              fullWidth={false}
            />
          </View>
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
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: theme.radii.modal,
    padding: theme.spacing['4xl'],
    borderWidth: 1,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
    marginBottom: theme.spacing.xl,
  },
  actions: {
    marginTop: theme.spacing.xl,
    alignItems: 'flex-end',
  },
});
