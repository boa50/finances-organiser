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
import { CategoryItem, PaymentMethodItem, Transaction, TransactionType } from '../types';
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/currencies';
import { categoryService } from '../services/categoryService';
import { paymentMethodService } from '../services/paymentMethodService';
import { tursoService } from '../services/tursoService';
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import { TransactionDatePicker } from './TransactionDatePicker';
import theme from '../theme';

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
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const loadCategories = async (targetType: TransactionType) => {
    const cats = await categoryService.getCategories(targetType);
    setAvailableCategories(cats);
    return cats;
  };

  const loadPaymentMethods = async () => {
    const pms = await paymentMethodService.getPaymentMethods();
    setAvailablePaymentMethods(pms);
    return pms;
  };

  useEffect(() => {
    if (!visible) return;

    const initModal = async () => {
      const activeType = transaction ? transaction.type : 'expense';
      setType(activeType);

      const cats = await loadCategories(activeType);
      const pms = await loadPaymentMethods();

      if (transaction) {
        setTitle(transaction.title);
        setAmount(String(transaction.amount));
        setCurrency(transaction.currency);
        setCategory(transaction.category);
        setPaymentMethod(transaction.paymentMethod || pms[0]?.name || 'Credit Card');
        setDate(dateFromTransaction(transaction.date));
        setNotes(transaction.notes || '');
      } else {
        setTitle('');
        setAmount('');
        setCurrency('BRL');
        setCategory(cats[0]?.name || '');
        setPaymentMethod(pms[0]?.name || 'Credit Card');
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
        paymentMethod: paymentMethod.trim() || undefined,
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
              <X size={20} color={theme.colors.textMuted} />
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
                    ? <TrendingUp size={16} color={theme.colors.textPrimary} />
                    : <TrendingDown size={16} color={theme.colors.textPrimary} />}
                  <Text style={styles.typeText}>{option === 'income' ? 'Income' : 'Expense'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field label="Title">
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Description" placeholderTextColor={theme.colors.textTertiary} />
            </Field>
            <Field label="Amount">
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={theme.colors.textTertiary} />
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
            <Field label="Way of Payment">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
                {availablePaymentMethods.map((item) => (
                  <TouchableOpacity key={item.id} onPress={() => setPaymentMethod(item.name)} style={[styles.chip, paymentMethod === item.name && styles.chipActive]}>
                    <Text style={styles.chipText}>💳 {item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Field>
            <Field label="Date">
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setDatePickerVisible(true)}>
                  <CalendarDays size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </Field>
            <Field label="Notes (optional)">
              <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Add a note" placeholderTextColor={theme.colors.textTertiary} multiline />
            </Field>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.saveText}>{transaction ? 'Save Changes' : 'Add Transaction'}</Text>}
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
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: theme.spacing['4xl'] },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii['4xl'], maxWidth: 560, width: '100%', maxHeight: '90%', alignSelf: 'center', padding: theme.spacing['5xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: theme.spacing.xxs },
  closeButton: { padding: theme.spacing.xs },
  closeText: { color: theme.colors.textMuted, fontSize: 20 },
  body: { gap: theme.spacing.xl },
  typeRow: { flexDirection: 'row', gap: theme.spacing.base },
  typeButton: { flex: 1, flexDirection: 'row', gap: theme.spacing.sm, borderRadius: theme.radii.base, backgroundColor: theme.colors.background, padding: theme.spacing.base, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderLight },
  expenseActive: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },
  incomeActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  typeText: { color: theme.colors.textPrimary, fontWeight: '700' },
  field: { gap: theme.spacing.sm },
  label: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderRadius: theme.radii.base, borderWidth: 1, borderColor: theme.colors.borderLight, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.base },
  pickerRow: { flexDirection: 'row' },
  pickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.background, borderRadius: theme.radii.base, borderWidth: 1, borderColor: theme.colors.borderLight, paddingHorizontal: theme.spacing.lg, paddingVertical: 11 },
  pickerText: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '600' },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  chipList: { gap: 7, paddingVertical: theme.spacing.xxs },
  chip: { backgroundColor: theme.colors.background, borderRadius: theme.radii['3xl'], paddingHorizontal: theme.spacing.base, paddingVertical: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.borderLight },
  chipActive: { backgroundColor: theme.colors.accentDark, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textLight, fontSize: 12, fontWeight: '600' },
  saveButton: { backgroundColor: theme.colors.accentMid, borderRadius: theme.radii.base, padding: 13, alignItems: 'center', marginTop: theme.spacing.xs },
  saveText: { color: theme.colors.white, fontSize: 15, fontWeight: '800' },
});
