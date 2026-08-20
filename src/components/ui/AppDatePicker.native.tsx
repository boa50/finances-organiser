import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
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
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight,
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
            <Pressable
              style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.7 }]}
              onPress={onClose}
            >
              <AppText style={[styles.doneText, { color: theme.colors.accent }]}>
                {t('common.done')}
              </AppText>
            </Pressable>
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
    backgroundColor: theme.colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['3xl'],
    padding: theme.spacing['4xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  title: {
    color: theme.colors.textPrimary,
    alignSelf: 'flex-start',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.extrabold,
    marginBottom: theme.spacing.base,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  doneText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});
