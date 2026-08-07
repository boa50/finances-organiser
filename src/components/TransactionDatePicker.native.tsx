import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import theme from '../theme';

interface TransactionDatePickerProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export const TransactionDatePicker: React.FC<TransactionDatePickerProps> = ({
  visible,
  value,
  onChange,
  onClose,
}) => {
  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') onClose();
    if (selectedDate) onChange(selectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Select date</Text>
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing['4xl'], backgroundColor: theme.colors.overlay },
  card: { width: '100%', maxWidth: 360, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radii['3xl'], padding: theme.spacing['4xl'], borderWidth: 1, borderColor: theme.colors.borderLight },
  title: { color: theme.colors.textPrimary, alignSelf: 'flex-start', fontSize: 16, fontWeight: '800', marginBottom: theme.spacing.base },
  doneButton: { alignSelf: 'flex-end', paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md },
  doneText: { color: theme.colors.accent, fontWeight: '700' },
});
