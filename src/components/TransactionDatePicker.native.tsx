import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.75)' },
  card: { width: '100%', maxWidth: 360, alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { color: '#F8FAFC', alignSelf: 'flex-start', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  doneButton: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingBottom: 8 },
  doneText: { color: '#38BDF8', fontWeight: '700' },
});
