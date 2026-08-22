import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryItem, PaymentMethodItem, BankItem, CurrencyInfo, Transaction, TransactionType } from '../../types';
import { currencyService } from '../../services/currencyService';
import { categoryService } from '../../services/categoryService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { bankService } from '../../services/bankService';
import { tursoService } from '../../services/tursoService';
import { CategoryIcon } from '../CategoryIcon';
import {
  AppButton,
  AppChipSelector,
  AppDatePicker,
  AppModal,
  AppSegmentedControl,
  AppText,
  AppTextInput,
  FeedbackMessage,
} from '../ui';
import { CreditCard, Building2, Calendar } from 'lucide-react-native';
import theme, { useTheme } from '../../theme';
import { useToast } from '../../contexts';
import { calculateInstallmentDate, normalizeTransactionDate, parseTransactionDate } from '../../utils/financials';

export interface TransactionEditModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

function dateFromTransaction(dateStr: string): Date {
  const d = parseTransactionDate(dateStr);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  visible,
  transaction,
  onClose,
  onSaved,
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearFields = (targetType: TransactionType = 'expense') => {
    setType(targetType);
    setTitle('');
    setAmount('');
    setCurrencyId('BRL');
    setCategoryId('');
    setPaymentMethodId('');
    setBankId('');
    setStore('');
    setInstallments(0);
    setInstallmentInputText('1');
    setDate(new Date());
    setNotes('');
    setErrorMessage(null);
    setAvailableCategories([]);
    setAvailablePaymentMethods([]);
    setAvailableBanks([]);
    setAvailableCurrencies([]);
  };

  useEffect(() => {
    if (!visible) {
      setLoading(true);
      clearFields(transaction ? transaction.type : 'expense');
      return;
    }

    let isCancelled = false;

    const initModal = async () => {
      setLoading(true);
      const activeType = transaction ? transaction.type : 'expense';
      clearFields(activeType);

      try {
        const [cats, pms, bks, currs] = await Promise.all([
          categoryService.getEnabledCategories(activeType),
          paymentMethodService.getEnabledPaymentMethods(),
          bankService.getEnabledBanks(),
          currencyService.getEnabledCurrencies(),
        ]);

        if (isCancelled) return;

        setAvailableCategories(cats);
        setAvailablePaymentMethods(pms);
        setAvailableBanks(bks);
        setAvailableCurrencies(currs);

        if (transaction) {
          const currExists = currs.some((c) => c.code === transaction.currencyId);
          setCurrencyId(currExists ? transaction.currencyId : (currs.length > 0 ? currs[0].code : 'BRL'));

          const catExists = cats.some((c) => c.id === transaction.categoryId);
          const initialCatId = catExists ? (transaction.categoryId || '') : (cats.length > 0 ? cats[0].id : '');
          setCategoryId(initialCatId);

          const pmExists = pms.some((p) => p.id === transaction.paymentMethodId);
          const initialPmId = pmExists ? (transaction.paymentMethodId || '') : (pms.length > 0 ? pms[0].id : '');
          setPaymentMethodId(initialPmId);

          const bankExists = bks.some((b) => b.id === transaction.bankId);
          const initialBankId = bankExists ? (transaction.bankId || '') : '';
          setBankId(initialBankId);

          setStore(transaction.store || '');
          setNotes(transaction.notes || '');

          if (transaction.installments && transaction.installments > 1) {
            const totalAmount = transaction.amount * transaction.installments;
            setAmount(String(totalAmount));

            const originalTitle = transaction.title.replace(/\s*\(\d+\/\d+\)$/, '');
            setTitle(originalTitle);

            const thisDate = dateFromTransaction(transaction.date);
            const baseDate = calculateInstallmentDate(
              thisDate,
              -((transaction.installmentNumber || 1) - 1)
            );
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
      } catch (e: any) {
        if (!isCancelled) {
          setErrorMessage(e?.message || t('common.unexpectedError'));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    initModal();

    return () => {
      isCancelled = true;
    };
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
    const cats = await categoryService.getEnabledCategories(nextType);
    setAvailableCategories(cats);
    if (!cats.some((item) => item.id === categoryId)) {
      setCategoryId(cats[0]?.id || '');
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(t('transactionModal.titleAndAmountRequired'));
      return;
    }
    if (Number.isNaN(date.getTime())) {
      setErrorMessage(t('transactionModal.validDateRequired'));
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

        for (let i = 1; i <= finalInstallments; i++) {
          const installmentDate = calculateInstallmentDate(date, i - 1);

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

        for (let i = 1; i <= finalInstallments; i++) {
          const installmentDate = calculateInstallmentDate(date, i - 1);

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

      await onSaved?.();
      onClose();
      showToast({ type: 'success', message: t('toast.transactionSaved') });
    } catch (e: any) {
      setErrorMessage(e?.message || t('transactionModal.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const parsedAmountNum = Number(amount.replace(',', '.')) || 0;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={transaction ? t('transactionModal.editTransaction') : t('transactionModal.addTransaction')}
      subtitle={
        transaction
          ? t('transactionModal.editSubtitle', { defaultValue: 'Update existing transaction details' })
          : t('transactionModal.addSubtitle', { defaultValue: 'Record a new income or expense' })
      }
    >
      <View style={styles.modalBody}>
        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        )}

        <ScrollView
          style={[styles.container, loading && styles.containerLoading]}
          contentContainerStyle={styles.content}
          pointerEvents={loading ? 'none' : 'auto'}
        >
          {errorMessage && (
            <View style={styles.errorContainer}>
              <FeedbackMessage type="error" message={errorMessage} />
            </View>
          )}

          {/* Type selector */}
          <AppSegmentedControl<TransactionType>
            options={[
              {
                label: t('common.income'),
                value: 'income',
                selectedBackgroundColor: theme.colors.successBg,
                selectedBorderColor: theme.colors.success,
                selectedTextColor: theme.colors.success,
              },
              {
                label: t('common.expense'),
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
          <Field label={t('transactionModal.titleField')}>
            <AppTextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('transactionModal.titlePlaceholder')}
            />
          </Field>

          {/* Amount */}
          <Field label={t('transactionModal.amountField')}>
            <AppTextInput
              size="lg"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              inputStyle={styles.amountInputText}
            />
          </Field>

          {/* Currency */}
          {availableCurrencies.length > 0 && (
            <Field label={t('transactionModal.currencyField')}>
              <AppChipSelector
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
            <Field label={t('transactionModal.categoryField')}>
              <AppChipSelector
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
                <Field label={t('transactionModal.paymentMethodField')}>
                  <AppChipSelector
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
                <Field label={t('transactionModal.installmentsField')}>
                  <View style={styles.installmentRow}>
                    <Pressable
                      onPress={() => {
                        const n = Math.max(1, (installments || 1) - 1);
                        setInstallments(n);
                        setInstallmentInputText(String(n));
                      }}
                      style={({ pressed }) => [
                        styles.installmentBtn,
                        {
                          backgroundColor: theme.colors.surfaceRecessed,
                          borderColor: theme.colors.borderLight,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityLabel="Decrease installments"
                    >
                      <AppText style={[styles.installmentBtnText, { color: theme.colors.textPrimary }]}>−</AppText>
                    </Pressable>

                    <AppTextInput
                      style={styles.installmentInputBox}
                      inputStyle={styles.installmentInputText}
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

                    <Pressable
                      onPress={() => {
                        const n = (installments || 1) + 1;
                        setInstallments(n);
                        setInstallmentInputText(String(n));
                      }}
                      style={({ pressed }) => [
                        styles.installmentBtn,
                        {
                          backgroundColor: theme.colors.surfaceRecessed,
                          borderColor: theme.colors.borderLight,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityLabel="Increase installments"
                    >
                      <AppText style={[styles.installmentBtnText, { color: theme.colors.textPrimary }]}>+</AppText>
                    </Pressable>
                  </View>

                  {installments > 1 && parsedAmountNum > 0 && (
                    <AppText style={[styles.installmentHint, { color: theme.colors.accent }]}>
                      {t('transactionModal.installmentHint', {
                        count: installments,
                        currency: currencyId,
                        amount: (parsedAmountNum / installments).toFixed(2),
                      })}
                    </AppText>
                  )}
                </Field>
              )}

              {availableBanks.length > 0 && (
                <Field label={t('transactionModal.bankField')}>
                  <AppChipSelector
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
            </>
          )}

          {/* Date Picker Button */}
          <Field label={t('transactionModal.dateField')}>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={({ pressed }) => [
                styles.datePickerBtn,
                {
                  backgroundColor: theme.colors.surfaceRecessed,
                  borderColor: theme.colors.borderLight,
                },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Select transaction date"
            >
              <View style={styles.datePickerBtnLeft}>
                <Calendar size={16} color={theme.colors.accent} />
                <AppText style={[styles.datePickerValueText, { color: theme.colors.textPrimary }]}>
                  {date.toLocaleDateString(i18n.language || undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </AppText>
              </View>
            </Pressable>

            <AppDatePicker
              visible={datePickerVisible}
              value={date}
              onChange={(d) => setDate(d)}
              onClose={() => setDatePickerVisible(false)}
            />
          </Field>

          {/* Store */}
          {type === 'expense' && (
              <Field label={t('transactionModal.storeField')}>
                <AppTextInput
                  value={store}
                  onChangeText={setStore}
                  placeholder={t('transactionModal.storePlaceholder')}
                />
              </Field>
          )}

          {/* Notes */}
          <Field label={t('transactionModal.notesField')}>
            <AppTextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('transactionModal.notesPlaceholder')}
            />
          </Field>

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.actionBtnWrapper}>
              <AppButton
                title={t('common.cancel')}
                variant="ghost"
                onPress={onClose}
                disabled={saving}
                fullWidth={false}
              />
            </View>
            <View style={styles.actionBtnWrapper}>
              <AppButton
                title={saving ? t('transactionModal.saving') : transaction ? t('management.saveChanges') : t('transactionModal.addTransaction')}
                variant="primary"
                onPress={handleSave}
                disabled={saving || loading}
                loading={saving}
                fullWidth={false}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </AppModal>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <AppText style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</AppText>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    position: 'relative',
  },
  container: {
    maxHeight: 520,
  },
  containerLoading: {
    opacity: 0.35,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(3px)' } as any) : {}),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputText: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  installmentBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installmentBtnText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  installmentInputBox: {
    flex: 1,
  },
  installmentInputText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  installmentHint: {
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
    fontWeight: theme.fontWeight.medium,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radii.input,
    borderWidth: 1,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
  },
  datePickerBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  datePickerValueText: {
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
