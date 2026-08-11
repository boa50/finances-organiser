import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BankItem, CategoryItem, PaymentMethodItem, Transaction, TransactionType } from '../types';
import { CURRENCIES } from '../utils/currencies';
import { categoryService } from '../services/categoryService';
import { paymentMethodService } from '../services/paymentMethodService';
import { bankService } from '../services/bankService';
import { tursoService } from '../services/tursoService';
import { Building2, CalendarDays, CreditCard, TrendingDown, TrendingUp } from 'lucide-react-native';
import { TransactionDatePicker } from './TransactionDatePicker';
import { CategoryIcon } from './CategoryIcon';
import { ChipSelector } from './ChipSelector';
import { AppModal, AppText } from './ui';
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
  const [bank, setBank] = useState<string>('');
  const [availableBanks, setAvailableBanks] = useState<BankItem[]>([]);
  const [store, setStore] = useState('');
  const [installments, setInstallments] = useState<number>(0);
  const [installmentInputText, setInstallmentInputText] = useState<string>('1');
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

  const loadBanks = async () => {
    const bks = await bankService.getBanks();
    setAvailableBanks(bks);
    return bks;
  };

  useEffect(() => {
    if (!visible) return;

    const initModal = async () => {
      const activeType = transaction ? transaction.type : 'expense';
      setType(activeType);

      const cats = await loadCategories(activeType);
      const pms = await loadPaymentMethods();
      const bks = await loadBanks();

      if (transaction) {
        setCurrency(transaction.currency);
        setCategory(transaction.category);
        const pmName = transaction.paymentMethod || pms[0]?.name || 'Credit Card';
        setPaymentMethod(pmName);
        setBank(transaction.bank || '');
        setStore(transaction.store || '');
        setNotes(transaction.notes || '');

        if (transaction.installments && transaction.installments > 1) {
          const totalAmount = transaction.amount * transaction.installments;
          setAmount(String(totalAmount));

          const originalTitle = transaction.title.replace(/\s*\(\d+\/\d+\)$/, '');
          setTitle(originalTitle);

          const thisDate = dateFromTransaction(transaction.date);
          const baseDate = new Date(thisDate);
          baseDate.setMonth(baseDate.getMonth() - ((transaction.installmentNumber || 1) - 1));
          setDate(baseDate);

          setInstallments(transaction.installments);
          setInstallmentInputText(String(transaction.installments));
        } else {
          setTitle(transaction.title);
          setAmount(String(transaction.amount));
          setDate(dateFromTransaction(transaction.date));
          setInstallments(transaction.installments || 0);
          setInstallmentInputText(String(transaction.installments || 1));
        }
      } else {
        setTitle('');
        setAmount('');
        setCurrency('BRL');
        setCategory(cats[0]?.name || '');
        const defaultPmName = pms[0]?.name || 'Credit Card';
        setPaymentMethod(defaultPmName);
        setBank('');
        setStore('');
        setDate(new Date());
        setNotes('');

        const defaultPm = pms.find((p) => p.name === defaultPmName) || pms[0];
        const initInst = defaultPm?.allowInstallments ? 1 : 0;
        setInstallments(initInst);
        setInstallmentInputText(String(initInst || 1));
      }
    };

    initModal();
  }, [visible, transaction]);

  const currentPmItem = availablePaymentMethods.find((pm) => pm.name === paymentMethod);
  const pmSupportsInstallments = currentPmItem?.allowInstallments ?? false;

  const selectPaymentMethod = (pmName: string) => {
    setPaymentMethod(pmName);
    const targetPm = availablePaymentMethods.find((pm) => pm.name === pmName);
    if (targetPm?.allowInstallments) {
      if (installments === 0) {
        setInstallments(1);
        setInstallmentInputText('1');
      }
    } else {
      setInstallments(0);
      setInstallmentInputText('1');
    }
  };

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
      const finalInstallments = type === 'expense' && pmSupportsInstallments ? Math.max(1, installments) : 0;

      const transactionData = {
        type,
        title: title.trim(),
        amount: parsedAmount,
        currency,
        category: category.trim(),
        paymentMethod: type === 'expense' ? (paymentMethod.trim() || undefined) : undefined,
        bank: type === 'expense' ? (bank.trim() || undefined) : undefined,
        store: type === 'expense' ? (store.trim() || undefined) : undefined,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
      };

      if (!transaction && finalInstallments > 1) {
        const perAmount = parsedAmount / finalInstallments;
        const groupId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const baseDate = new Date(date);

        for (let i = 1; i <= finalInstallments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

          await tursoService.addTransaction({
            ...transactionData,
            title: `${title.trim()} (${i}/${finalInstallments})`,
            amount: perAmount,
            date: installmentDate.toISOString(),
            installments: finalInstallments,
            installmentNumber: i,
            installmentGroupId: groupId,
          });
        }
      } else if (transaction && finalInstallments > 1) {
        const groupId = transaction.installmentGroupId || `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        await tursoService.deleteTransactionGroup(groupId, transaction);

        const perAmount = parsedAmount / finalInstallments;
        const baseDate = new Date(date);

        for (let i = 1; i <= finalInstallments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

          await tursoService.addTransaction({
            ...transactionData,
            title: `${title.trim()} (${i}/${finalInstallments})`,
            amount: perAmount,
            date: installmentDate.toISOString(),
            installments: finalInstallments,
            installmentNumber: i,
            installmentGroupId: groupId,
          });
        }
      } else {
        const txWithInstallments = {
          ...transactionData,
          installments: finalInstallments,
          installmentNumber: finalInstallments > 0 ? 1 : 0,
          installmentGroupId: undefined,
        };

        if (transaction) {
          if (transaction.installments && transaction.installments > 1) {
            const oldGroupId = transaction.installmentGroupId || '';
            await tursoService.deleteTransactionGroup(oldGroupId, transaction);
            await tursoService.addTransaction(txWithInstallments);
          } else {
            await tursoService.updateTransaction(transaction.id, txWithInstallments);
          }
        } else {
          await tursoService.addTransaction(txWithInstallments);
        }
      }

      onSaved();
      onClose();
    } catch (error: any) {
      alert(`Unable to update transaction: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const parsedAmountNum = Number(amount.replace(',', '.')) || 0;

  return (
    <>
      <AppModal
        visible={visible}
        onClose={onClose}
        title={transaction ? 'Edit Transaction' : 'Add Transaction'}
        subtitle={transaction ? 'Update an income or expense' : 'Record a new income or expense'}
      >
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
                <AppText style={styles.typeText}>{option === 'income' ? 'Income' : 'Expense'}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Title">
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Description" placeholderTextColor={theme.colors.textTertiary} />
          </Field>
          <Field label={type === 'expense' && pmSupportsInstallments && installments > 1 ? "Total Amount" : "Amount"}>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={theme.colors.textTertiary} />
          </Field>

          <Field label="Currency">
            <ChipSelector
              items={CURRENCIES}
              selectedId={currency}
              onSelect={(item) => setCurrency(item.code)}
              keyExtractor={(item) => item.code}
              labelExtractor={(item) => `${item.flag} ${item.code}`}
            />
          </Field>

          <Field label="Category">
            <ChipSelector
              items={availableCategories}
              selectedId={category}
              onSelect={(item) => setCategory(item.name)}
              keyExtractor={(item) => item.id || item.name}
              labelExtractor={(item) => item.name}
              renderIcon={(item) => (
                <CategoryIcon
                  iconName={item.icon}
                  color={category === item.name ? theme.colors.accent : item.color || theme.colors.textSecondary}
                  size={14}
                />
              )}
            />
          </Field>

          {type === 'expense' && (
            <>
              <Field label="Way of Payment">
                <ChipSelector
                  items={availablePaymentMethods}
                  selectedId={paymentMethod}
                  onSelect={(item) => selectPaymentMethod(item.name)}
                  keyExtractor={(item) => item.id}
                  labelExtractor={(item) => item.name}
                  renderIcon={(item) => (
                    <CreditCard
                      size={14}
                      color={paymentMethod === item.name ? theme.colors.accent : theme.colors.textSecondary}
                    />
                  )}
                />
              </Field>

              {pmSupportsInstallments && (
                <Field label="Installments">
                  <View style={styles.installmentRow}>
                    <TouchableOpacity
                      onPress={() => {
                        const n = Math.max(1, (installments || 1) - 1);
                        setInstallments(n);
                        setInstallmentInputText(String(n));
                      }}
                      style={styles.installmentBtn}
                    >
                      <AppText style={styles.installmentBtnText}>−</AppText>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.installmentInput}
                      value={installmentInputText}
                      onChangeText={(text) => {
                        setInstallmentInputText(text);
                        const parsed = parseInt(text, 10);
                        if (!isNaN(parsed) && parsed >= 1) {
                          setInstallments(parsed);
                        }
                      }}
                      keyboardType="number-pad"
                      textAlign="center"
                    />

                    <TouchableOpacity
                      onPress={() => {
                        const n = (installments || 1) + 1;
                        setInstallments(n);
                        setInstallmentInputText(String(n));
                      }}
                      style={styles.installmentBtn}
                    >
                      <AppText style={styles.installmentBtnText}>+</AppText>
                    </TouchableOpacity>
                  </View>

                  {installments > 1 && parsedAmountNum > 0 && (
                    <AppText style={styles.installmentHint}>
                      {installments}× of {currency} {(parsedAmountNum / installments).toFixed(2)} / month
                    </AppText>
                  )}
                </Field>
              )}

              <Field label="Bank (optional)">
                <ChipSelector
                  items={[{ id: 'none', name: 'None' }, ...availableBanks]}
                  selectedId={bank || 'none'}
                  onSelect={(item) => setBank(item.name === 'None' ? '' : item.name)}
                  keyExtractor={(item) => item.id}
                  labelExtractor={(item) => item.name}
                  renderIcon={(item) =>
                    item.name !== 'None' ? (
                      <Building2
                        size={14}
                        color={(bank || 'None') === item.name ? theme.colors.accent : theme.colors.textSecondary}
                      />
                    ) : undefined
                  }
                />
              </Field>

              <Field label="Store / Merchant (optional)">
                <TextInput style={styles.input} value={store} onChangeText={setStore} placeholder="e.g. Amazon, Supermarket, Target" placeholderTextColor={theme.colors.textTertiary} />
              </Field>
            </>
          )}

          <Field label="Date">
            <View style={styles.pickerRow}>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setDatePickerVisible(true)}>
                <CalendarDays size={16} color={theme.colors.textSecondary} />
                <AppText style={styles.pickerText}>{date.toLocaleDateString()}</AppText>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Notes (optional)">
            <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Add a note" placeholderTextColor={theme.colors.textTertiary} multiline />
          </Field>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={theme.colors.white} /> : <AppText style={styles.saveText}>{transaction ? 'Save Changes' : 'Add Transaction'}</AppText>}
          </TouchableOpacity>
        </ScrollView>
      </AppModal>

      <TransactionDatePicker
        visible={datePickerVisible}
        value={date}
        onChange={setDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.field}>
    <AppText style={styles.label}>{label}</AppText>
    {children}
  </View>
);

function dateFromTransaction(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

const styles = StyleSheet.create({
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
  installmentRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  installmentBtn: { width: 42, height: 42, borderRadius: theme.radii.base, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  installmentBtnText: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
  installmentInput: { width: 70, height: 42, backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderRadius: theme.radii.base, borderWidth: 1, borderColor: theme.colors.borderLight, fontSize: 16, fontWeight: '700' },
  installmentHint: { color: theme.colors.accent, fontSize: 12, fontWeight: '600', marginTop: theme.spacing.xxs },
  saveButton: { backgroundColor: theme.colors.accentMid, borderRadius: theme.radii.base, padding: 13, alignItems: 'center', marginTop: theme.spacing.xs },
  saveText: { color: theme.colors.white, fontSize: 15, fontWeight: '800' },
});
