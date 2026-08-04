import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const handleChange = (event: any) => {
    const selectedDate = new Date(`${event.target.value}T12:00:00`);
    if (!Number.isNaN(selectedDate.getTime())) onChange(selectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Select date</Text>
          {React.createElement('input', {
            type: 'date',
            value: value.toISOString().slice(0, 10),
            onChange: handleChange,
            style: browserDateInputStyle,
          })}
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.75)' },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#1E293B', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  doneButton: { alignSelf: 'flex-end', marginTop: 14, paddingHorizontal: 14, paddingVertical: 8 },
  doneText: { color: '#38BDF8', fontWeight: '700' },
});

const browserDateInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#0F172A',
  color: '#F8FAFC',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: 12,
  fontSize: 15,
};
