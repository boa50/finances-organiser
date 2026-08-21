import React from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import theme, { useTheme } from '../../theme';

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

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') onClose();
    if (selectedDate) onChange(selectedDate);
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
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.actions}>
              <AppButton
                variant="primary"
                title={t('common.done')}
                onPress={onClose}
                fullWidth={false}
              />
            </View>
          )}
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
    alignItems: 'center',
    borderRadius: theme.radii.modal,
    padding: theme.spacing['4xl'],
    borderWidth: 1,
  },
  title: {
    alignSelf: 'flex-start',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
    marginBottom: theme.spacing.base,
  },
  actions: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.lg,
  },
});
