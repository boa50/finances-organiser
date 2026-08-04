import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryItem, Transaction, TransactionType } from '../types';
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/currencies';
import { categoryService } from '../services/categoryService';
import { tursoService } from '../services/tursoService';
import { CalendarDays, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import { TransactionDatePicker } from './TransactionDatePicker';

interface TransactionEditModalProps {
  visible: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  visible,
  onClose,
  transaction,
  onSaved,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [category, setCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const loadCategories = async (targetType: TransactionType) => {
    const cats = await categoryService.getCategories(targetType);
    setAvailableCategories(cats);
    return cats;
  };

  useEffect(() => {
    if (!visible) return;

    const initModal = async () => {
      const activeType = transaction ? transaction.type : 'expense';
      setType(activeType);

      const cats = await loadCategories(activeType);

      if (transaction) {
        setTitle(transaction.title);
        setAmount(String(transaction.amount));
        setCurrency(transaction.currency);
        setCategory(transaction.category);
        setDate(dateFromTransaction(transaction.date));
        setNotes(transaction.notes || '');
      } else {
        setTitle('');
        setAmount('');
        setCurrency('BRL');
        setCategory(cats[0]?.name || '');
        setDate(new Date());
        setNotes('');
      }
    };

    initModal();
  }, [visible, transaction]);

  const changeType = async (nextType: TransactionType) => {
    setType(nextType);
    const cats = await loadCategories(nextType);
    if (!cats.some((item) => item.name === category)) {
      setCategory(cats[0]?.name || '');
    }
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !category.trim()) {
      alert('Enter a title, category, and a valid amount greater than zero.');
      return;
    }
    if (Number.isNaN(date.getTime())) {
      alert('Enter a valid date and time.');
      return;
    }

    setSaving(true);
    try {
      const transactionData = {
        type,
        title: title.trim(),
        amount: parsedAmount,
        currency,
        category: category.trim(),
        date: date.toISOString(),
        notes: notes.trim() || undefined,
      };

      if (transaction) {
        await tursoService.updateTransaction(transaction.id, transactionData);
      } else {
        await tursoService.addTransaction(transactionData);
      }
      onSaved();
      onClose();
    } catch (error: any) {
      alert(`Unable to update transaction: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{transaction ? 'Edit Transaction' : 'Add Transaction'}</Text>
              <Text style={styles.subtitle}>
                {transaction ? 'Update an income or expense' : 'Record a new income or expense'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={saving} style={styles.closeButton}>
              <X size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.typeRow}>
              {(['expense', 'income'] as TransactionType[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => changeType(option)}
                  style={[styles.typeButton, type === option && (option === 'income' ? styles.incomeActive : styles.expenseActive)]}
                >
                  {option === 'income'
                    ? <TrendingUp size={16} color="#F8FAFC" />
                    : <TrendingDown size={16} color="#F8FAFC" />}
                  <Text style={styles.typeText}>{option === 'income' ? 'Income' : 'Expense'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field label="Title">
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Description" placeholderTextColor="#64748B" />
            </Field>
            <Field label="Amount">
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#64748B" />
            </Field>
            <Field label="Currency">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
                {CURRENCIES.map((item) => (
                  <TouchableOpacity key={item.code} onPress={() => setCurrency(item.code)} style={[styles.chip, currency === item.code && styles.chipActive]}>
                    <Text style={styles.chipText}>{item.flag} {item.code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Field>
            <Field label="Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
                {availableCategories.map((item) => (
                  <TouchableOpacity key={item.id || item.name} onPress={() => setCategory(item.name)} style={[styles.chip, category === item.name && styles.chipActive]}>
                    <Text style={styles.chipText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Field>
            <Field label="Date">
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setDatePickerVisible(true)}>
                  <CalendarDays size={16} color="#94A3B8" />
                  <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </Field>
            <Field label="Notes (optional)">
              <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Add a note" placeholderTextColor="#64748B" multiline />
            </Field>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{transaction ? 'Save Changes' : 'Add Transaction'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <TransactionDatePicker
        visible={datePickerVisible}
        value={date}
        onChange={setDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </Modal>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

function dateFromTransaction(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1E293B', borderRadius: 20, maxWidth: 560, width: '100%', maxHeight: '90%', alignSelf: 'center', padding: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  closeButton: { padding: 4 },
  closeText: { color: '#CBD5E1', fontSize: 20 },
  body: { gap: 14 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, flexDirection: 'row', gap: 6, borderRadius: 10, backgroundColor: '#0F172A', padding: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  expenseActive: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
  incomeActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  typeText: { color: '#F8FAFC', fontWeight: '700' },
  field: { gap: 6 },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 10 },
  pickerRow: { flexDirection: 'row' },
  pickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 11 },
  pickerText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  chipList: { gap: 7, paddingVertical: 2 },
  chip: { backgroundColor: '#0F172A', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#0369A1', borderColor: '#38BDF8' },
  chipText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
  saveButton: { backgroundColor: '#0284C7', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
