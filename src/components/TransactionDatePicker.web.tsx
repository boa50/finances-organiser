import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const handleChange = (event: any) => {
    const selectedDate = new Date(`${event.target.value}T00:00:00`);
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
          <Pressable
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing['4xl'], backgroundColor: theme.colors.overlay },
  card: { width: '100%', maxWidth: 360, backgroundColor: theme.colors.surface, borderRadius: theme.radii['3xl'], padding: theme.spacing['4xl'], borderWidth: 1, borderColor: theme.colors.borderLight },
  title: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: theme.spacing.xl },
  doneButton: { alignSelf: 'flex-end', marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md },
  doneText: { color: theme.colors.accent, fontWeight: '700' },
});

const browserDateInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: theme.colors.background,
  color: theme.colors.textPrimary,
  border: `1px solid ${theme.colors.borderLight}`,
  borderRadius: theme.radii.base,
  padding: theme.spacing.lg,
  fontSize: 15,
};
