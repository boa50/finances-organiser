import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryItem, PaymentMethodItem, BankItem, CurrencyInfo, Transaction, TransactionType } from '../types';
import { currencyService } from '../services/currencyService';
import { categoryService } from '../services/categoryService';
import { paymentMethodService } from '../services/paymentMethodService';
import { bankService } from '../services/bankService';
import { tursoService } from '../services/tursoService';
import { CategoryIcon } from './CategoryIcon';
import { ChipSelector } from './ChipSelector';
import { AppButton, AppModal, AppSegmentedControl, AppText, AppTextInput, FeedbackMessage } from './ui';
import { CreditCard, Building2, Calendar } from 'lucide-react-native';
import theme from '../theme';
import { TransactionDatePicker } from './TransactionDatePicker';
import { normalizeTransactionDate } from '../utils/financials';

export interface TransactionEditModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

function dateFromTransaction(dateStr: string): Date {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  visible,
  transaction,
  onClose,
  onSaved,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currencyId, setCurrencyId] = useState('BRL');
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [bankId, setBankId] = useState('');
  const [availableBanks, setAvailableBanks] = useState<BankItem[]>([]);
  const [store, setStore] = useState('');
  const [installments, setInstallments] = useState(0);
  const [installmentInputText, setInstallmentInputText] = useState('1');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const loadCurrencies = async () => {
    const currs = await currencyService.getCurrencies();
    setAvailableCurrencies(currs);
    return currs;
  };

  useEffect(() => {
    if (!visible) return;

    const initModal = async () => {
      setErrorMessage(null);
      const activeType = transaction ? transaction.type : 'expense';
      setType(activeType);

      const cats = await loadCategories(activeType);
      const pms = await loadPaymentMethods();
      const bks = await loadBanks();
      const currs = await loadCurrencies();

      if (transaction) {
        setCurrencyId(transaction.currencyId);

        const initialCatId = transaction.categoryId || '';
        setCategoryId(initialCatId);

        const initialPmId = transaction.paymentMethodId || (pms.length > 0 ? pms[0].id : '');
        setPaymentMethodId(initialPmId);

        const initialBankId = transaction.bankId || '';
        setBankId(initialBankId);

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
        setCurrencyId(currs.length > 0 ? currs[0].code : 'BRL');
        setCategoryId(cats.length > 0 ? cats[0].id : '');
        const defaultPmId = pms.length > 0 ? pms[0].id : '';
        setPaymentMethodId(defaultPmId);
        setBankId('');
        setStore('');
        setDate(new Date());
        setNotes('');

        const defaultPm = pms.find((p) => p.id === defaultPmId) || pms[0];
        const initInst = defaultPm?.allowInstallments ? 1 : 0;
        setInstallments(initInst);
        setInstallmentInputText(String(initInst || 1));
      }
    };

    initModal();
  }, [visible, transaction]);

  const currentPmItem = availablePaymentMethods.find((pm) => pm.id === paymentMethodId);
  const pmSupportsInstallments = currentPmItem?.allowInstallments ?? false;

  const selectPaymentMethod = (pmItem: PaymentMethodItem) => {
    setPaymentMethodId(pmItem.id);
    if (pmItem.allowInstallments) {
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
    if (!cats.some((item) => item.id === categoryId)) {
      setCategoryId(cats[0]?.id || '');
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Enter a title and a valid amount greater than zero.');
      return;
    }
    if (Number.isNaN(date.getTime())) {
      setErrorMessage('Enter a valid date.');
      return;
    }

    setSaving(true);
    try {
      const finalInstallments = type === 'expense' && pmSupportsInstallments ? Math.max(1, installments) : 0;

      const transactionData = {
        type,
        title: title.trim(),
        amount: parsedAmount,
        currencyId,
        categoryId: categoryId || undefined,
        paymentMethodId: type === 'expense' ? (paymentMethodId || undefined) : undefined,
        bankId: type === 'expense' ? (bankId || undefined) : undefined,
        store: type === 'expense' ? (store.trim() || undefined) : undefined,
        date: normalizeTransactionDate(date),
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
            date: normalizeTransactionDate(installmentDate),
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
            date: normalizeTransactionDate(installmentDate),
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
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error saving transaction.');
    } finally {
      setSaving(false);
    }
  };

  const parsedAmountNum = Number(amount.replace(',', '.')) || 0;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {errorMessage && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={errorMessage} />
          </View>
        )}

        {/* Type selector */}
        <AppSegmentedControl<TransactionType>
          options={[
            {
              label: 'Income',
              value: 'income',
              selectedBackgroundColor: theme.colors.successBg,
              selectedBorderColor: theme.colors.success,
              selectedTextColor: theme.colors.success,
            },
            {
              label: 'Expense',
              value: 'expense',
              selectedBackgroundColor: theme.colors.dangerBg,
              selectedBorderColor: theme.colors.danger,
              selectedTextColor: theme.colors.danger,
            },
          ]}
          selectedValue={type}
          onSelect={(nextType) => changeType(nextType)}
        />

        {/* Title */}
        <Field label="Title *">
          <AppTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Grocery Store, Salary"
          />
        </Field>

        {/* Amount */}
        <Field label="Amount *">
          <AppTextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
          />
        </Field>

        {/* Currency */}
        {availableCurrencies.length > 0 && (
          <Field label="Currency">
            <ChipSelector
              items={availableCurrencies}
              selectedId={currencyId}
              onSelect={(item) => setCurrencyId(item.code)}
              keyExtractor={(item) => item.code}
              labelExtractor={(item) => `${item.flag} ${item.code}`}
            />
          </Field>
        )}

        {/* Category */}
        {availableCategories.length > 0 && (
          <Field label="Category">
            <ChipSelector
              items={availableCategories}
              selectedId={categoryId}
              onSelect={(item) => setCategoryId(item.id)}
              keyExtractor={(item) => item.id}
              labelExtractor={(item) => item.name}
              getItemColor={(item) => item.color}
              renderIcon={(item) => (
                <CategoryIcon
                  iconName={item.icon}
                  color={item.color}
                  size={14}
                />
              )}
            />
          </Field>
        )}

        {/* Payment Method & Bank */}
        {type === 'expense' && (
          <>
            {availablePaymentMethods.length > 0 && (
              <Field label="Payment Method (optional)">
                <ChipSelector
                  items={availablePaymentMethods}
                  selectedId={paymentMethodId}
                  onSelect={(item) => selectPaymentMethod(item)}
                  keyExtractor={(item) => item.id}
                  labelExtractor={(item) => item.name}
                  renderIcon={(_item, active) => (
                    <CreditCard
                      size={14}
                      color={active ? theme.colors.accent : theme.colors.textSecondary}
                    />
                  )}
                />
              </Field>
            )}

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
                    {installments}× of {currencyId} {(parsedAmountNum / installments).toFixed(2)} / month
                  </AppText>
                )}
              </Field>
            )}

            {availableBanks.length > 0 && (
              <Field label="Bank (optional)">
                <ChipSelector
                  items={availableBanks}
                  selectedId={bankId}
                  onSelect={(item) => setBankId(item.id === bankId ? '' : item.id)}
                  keyExtractor={(item) => item.id}
                  labelExtractor={(item) => item.name}
                  renderIcon={(_item, active) => (
                    <Building2
                      size={14}
                      color={active ? theme.colors.accent : theme.colors.textSecondary}
                    />
                  )}
                />
              </Field>
            )}

            <Field label="Store / Merchant (optional)">
              <AppTextInput
                value={store}
                onChangeText={setStore}
                placeholder="e.g. Amazon, Supermarket, Target"
              />
            </Field>
          </>
        )}

        {/* Date Picker Button */}
        <Field label="Date">
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={styles.datePickerBtn}
          >
            <View style={styles.datePickerBtnLeft}>
              <Calendar size={16} color={theme.colors.accent} />
              <AppText style={styles.datePickerValueText}>
                {date.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </AppText>
            </View>
          </TouchableOpacity>

          <TransactionDatePicker
            visible={datePickerVisible}
            value={date}
            onChange={(d) => setDate(d)}
            onClose={() => setDatePickerVisible(false)}
          />
        </Field>

        {/* Notes */}
        <Field label="Notes (optional)">
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add optional notes..."
          />
        </Field>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              disabled={saving}
              fullWidth={false}
            />
          </View>
          <View style={styles.actionBtnWrapper}>
            <AppButton
              title={saving ? 'Saving...' : transaction ? 'Save Changes' : 'Add Transaction'}
              variant="primary"
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              fullWidth={false}
            />
          </View>
        </View>
      </ScrollView>
    </AppModal>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.field}>
    <AppText style={styles.fieldLabel}>{label}</AppText>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    maxHeight: 520,
  },
  content: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  errorContainer: {
    marginBottom: theme.spacing.xs,
  },
  field: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  installmentBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installmentBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  installmentInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  installmentHint: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  datePickerBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  datePickerValueText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionBtnWrapper: {
    minWidth: 110,
  },
});
