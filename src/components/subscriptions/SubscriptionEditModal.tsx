import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankItem, CategoryItem, CurrencyInfo, PaymentMethodItem, Subscription } from '../../types';
import { currencyService } from '../../services/currencyService';
import { categoryService } from '../../services/categoryService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { bankService } from '../../services/bankService';
import { subscriptionService } from '../../services/subscriptionService';
import { getSubscriptionTargetDate, handleSubscriptionBillingUpdate } from '../../services/subscriptionAutoGenerator';
import { normalizeTransactionDate } from '../../utils/financials';
import { tursoService } from '../../services/tursoService';
import { CategoryIcon } from '../CategoryIcon';
import {
  AppButton,
  AppChipSelector,
  AppModal,
  AppSegmentedControl,
  AppSwitch,
  AppText,
  AppTextInput,
  FeedbackMessage,
} from '../ui';
import { Building2, CreditCard } from 'lucide-react-native';
import theme, { useTheme } from '../../theme';

export interface SubscriptionEditModalProps {
  visible: boolean;
  subscription?: Subscription | null;
  onClose: () => void;
  onSaved: () => void;
}

export const SubscriptionEditModal: React.FC<SubscriptionEditModalProps> = ({
  visible,
  subscription,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currencyId, setCurrencyId] = useState('BRL');
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [bankId, setBankId] = useState<string>('');
  const [availableBanks, setAvailableBanks] = useState<BankItem[]>([]);
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [billingDay, setBillingDay] = useState('1');
  const [billingMonth, setBillingMonth] = useState('1');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthOptions = [
    { id: '1', label: t('months.1') || 'Jan' },
    { id: '2', label: t('months.2') || 'Feb' },
    { id: '3', label: t('months.3') || 'Mar' },
    { id: '4', label: t('months.4') || 'Apr' },
    { id: '5', label: t('months.5') || 'May' },
    { id: '6', label: t('months.6') || 'Jun' },
    { id: '7', label: t('months.7') || 'Jul' },
    { id: '8', label: t('months.8') || 'Aug' },
    { id: '9', label: t('months.9') || 'Sep' },
    { id: '10', label: t('months.10') || 'Oct' },
    { id: '11', label: t('months.11') || 'Nov' },
    { id: '12', label: t('months.12') || 'Dec' },
  ];

  const clearFields = () => {
    setTitle('');
    setAmount('');
    setCurrencyId('BRL');
    setCategoryId('');
    setPaymentMethodId('');
    setBankId('');
    setFrequency('monthly');
    setBillingDay('1');
    setBillingMonth('1');
    setActive(true);
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
      clearFields();
      return;
    }

    let isCancelled = false;

    const init = async () => {
      setLoading(true);
      clearFields();

      try {
        const [cats, pms, bks, currs] = await Promise.all([
          categoryService.getEnabledCategories('expense'),
          paymentMethodService.getEnabledPaymentMethods(),
          bankService.getEnabledBanks(),
          currencyService.getEnabledCurrencies(),
        ]);

        if (isCancelled) return;

        setAvailableCategories(cats);
        setAvailablePaymentMethods(pms);
        setAvailableBanks(bks);
        setAvailableCurrencies(currs);

        if (subscription) {
          setTitle(subscription.title);
          setAmount(String(subscription.amount));
          const currExists = currs.some((c) => c.code === subscription.currencyId);
          setCurrencyId(currExists ? subscription.currencyId : (currs.length > 0 ? currs[0].code : 'BRL'));
          const catExists = cats.some((c) => c.id === subscription.categoryId);
          setCategoryId(catExists ? (subscription.categoryId || '') : (cats.length > 0 ? cats[0].id : ''));
          const pmExists = pms.some((p) => p.id === subscription.paymentMethodId);
          setPaymentMethodId(pmExists ? (subscription.paymentMethodId || '') : '');
          const bankExists = bks.some((b) => b.id === subscription.bankId);
          setBankId(bankExists ? (subscription.bankId || '') : '');
          setFrequency(subscription.frequency || 'monthly');
          setBillingDay(String(subscription.billingDay));
          setBillingMonth(subscription.billingMonth ? String(subscription.billingMonth) : '1');
          setActive(subscription.active);
          setNotes(subscription.notes || '');
        } else {
          setTitle('');
          setAmount('');
          setCurrencyId(currs.length > 0 ? currs[0].code : 'BRL');
          setCategoryId(cats.length > 0 ? cats[0].id : '');
          setPaymentMethodId('');
          setBankId('');
          setFrequency('monthly');
          setBillingDay('1');
          setBillingMonth('1');
          setActive(true);
          setNotes('');
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

    init();

    return () => {
      isCancelled = true;
    };
  }, [visible, subscription]);

  const handleSave = async () => {
    setErrorMessage(null);
    const parsedAmount = Number(amount.replace(',', '.'));
    const parsedDay = parseInt(billingDay, 10);
    const parsedMonth = frequency === 'annual' ? parseInt(billingMonth, 10) : undefined;

    if (!title.trim()) {
      setErrorMessage(t('subscriptionModal.titleRequired'));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(t('subscriptionModal.amountRequired'));
      return;
    }
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setErrorMessage(t('subscriptionModal.billingDayRequired'));
      return;
    }
    if (frequency === 'annual' && (!parsedMonth || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
      setErrorMessage(t('subscriptionModal.billingMonthRequired'));
      return;
    }

    setSaving(true);
    try {
      if (subscription) {
        const oldBillingDay = subscription.billingDay;
        const oldBillingMonth = subscription.billingMonth;
        const oldFrequency = subscription.frequency || 'monthly';

        const updated = await subscriptionService.updateSubscription(subscription.id, {
          title: title.trim(),
          amount: parsedAmount,
          currencyId,
          categoryId: categoryId || undefined,
          paymentMethodId: paymentMethodId || undefined,
          bankId: bankId || undefined,
          frequency,
          billingDay: parsedDay,
          billingMonth: parsedMonth,
          active,
          notes: notes.trim() || undefined,
        });

        // Trigger auto-generator checks if billing day, month, or frequency changed
        const billingChanged =
          oldBillingDay !== parsedDay ||
          oldBillingMonth !== parsedMonth ||
          oldFrequency !== frequency;

        if (billingChanged) {
          const currentTxs = await tursoService.getTransactions();
          await handleSubscriptionBillingUpdate(updated, currentTxs);
        }
      } else {
        const created = await subscriptionService.addSubscription({
          title: title.trim(),
          amount: parsedAmount,
          currencyId,
          categoryId: categoryId || undefined,
          paymentMethodId: paymentMethodId || undefined,
          bankId: bankId || undefined,
          frequency,
          billingDay: parsedDay,
          billingMonth: parsedMonth,
          active,
          notes: notes.trim() || undefined,
        });

        // Trigger auto-generation for current period if applicable
        if (created.active) {
          const now = new Date();
          const currentYear = now.getFullYear();

          if (created.frequency === 'annual') {
            const billingMonth0 = (created.billingMonth || 1) - 1;
            const targetDate = getSubscriptionTargetDate(created.billingDay, currentYear, billingMonth0);
            if (targetDate <= now) {
              const targetIso = normalizeTransactionDate(targetDate);
              await tursoService.addTransaction({
                title: created.title,
                amount: created.amount,
                type: 'expense',
                currencyId: created.currencyId,
                categoryId: created.categoryId,
                paymentMethodId: created.paymentMethodId,
                bankId: created.bankId,
                store: created.store,
                date: targetIso,
                notes: created.notes || undefined,
                subscriptionId: created.id,
              });
            }
          } else {
            const currentMonth = now.getMonth();
            const targetDate = getSubscriptionTargetDate(created.billingDay, currentYear, currentMonth);
            if (targetDate <= now) {
              const targetIso = normalizeTransactionDate(targetDate);
              await tursoService.addTransaction({
                title: created.title,
                amount: created.amount,
                type: 'expense',
                currencyId: created.currencyId,
                categoryId: created.categoryId,
                paymentMethodId: created.paymentMethodId,
                bankId: created.bankId,
                store: created.store,
                date: targetIso,
                notes: created.notes || undefined,
                subscriptionId: created.id,
              });
            }
          }
        }
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || t('subscriptionModal.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={subscription ? t('subscriptionModal.editTitle') : t('subscriptionModal.addTitle')}
      subtitle={
        subscription
          ? t('subscriptionModal.editSubtitle', { defaultValue: 'Update subscription details and billing cadence' })
          : t('subscriptionModal.addSubtitle', { defaultValue: 'Set up an automated recurring expense' })
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

          {/* Frequency */}
          <View style={styles.fieldGroup}>
            <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('subscriptionModal.frequencyField')}
            </AppText>
            <AppSegmentedControl<'monthly' | 'annual'>
              options={[
                { label: t('subscriptionModal.frequencyMonthly'), value: 'monthly' },
                { label: t('subscriptionModal.frequencyAnnual'), value: 'annual' },
              ]}
              selectedValue={frequency}
              onSelect={setFrequency}
            />
          </View>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('transactionModal.titleField')}
            </AppText>
            <AppTextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('subscriptionModal.titlePlaceholder')}
            />
          </View>

          

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
              {frequency === 'annual'
                ? t('subscriptionModal.annualAmountLabel')
                : t('subscriptionModal.monthlyAmountLabel')}
            </AppText>
            <AppTextInput
              size="lg"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              inputStyle={styles.amountInputText}
            />
          </View>

          {/* Currency selector chips */}
          {availableCurrencies.length > 0 && (
            <View style={styles.fieldGroup}>
              <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('transactionModal.currencyField')}
              </AppText>
              <AppChipSelector
                items={availableCurrencies}
                selectedId={currencyId}
                onSelect={(item) => setCurrencyId(item.code)}
                keyExtractor={(item) => item.code}
                labelExtractor={(item) => `${item.flag} ${item.code}`}
              />
            </View>
          )}

          {/* Billing Month (Annual only) */}
          {frequency === 'annual' && (
            <View style={styles.fieldGroup}>
              <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('subscriptionModal.billingMonthField')}
              </AppText>
              <AppChipSelector
                items={monthOptions}
                selectedId={billingMonth}
                onSelect={(item) => setBillingMonth(item.id)}
                keyExtractor={(item) => item.id}
                labelExtractor={(item) => item.label}
              />
            </View>
          )}

          {/* Billing Day */}
          <View style={styles.fieldGroup}>
            <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
              {frequency === 'annual'
                ? t('subscriptionModal.billingDayFieldAnnual')
                : t('subscriptionModal.billingDayField')}
            </AppText>
            <AppTextInput
              value={billingDay}
              onChangeText={setBillingDay}
              placeholder="1"
              keyboardType="number-pad"
            />
            <AppText style={[styles.fieldHint, { color: theme.colors.textTertiary }]}>
              {frequency === 'annual'
                ? t('subscriptionModal.billingDayHintAnnual', {
                    month: monthOptions.find((m) => m.id === billingMonth)?.label || '',
                    day: billingDay || '1',
                  })
                : t('subscriptionModal.billingDayHint', { day: billingDay || '1' })}
            </AppText>
          </View>

          {/* Category */}
          {availableCategories.length > 0 && (
            <View style={styles.fieldGroup}>
              <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('transactionModal.categoryField')}
              </AppText>
              <AppChipSelector
                items={availableCategories}
                selectedId={categoryId}
                onSelect={(cat) => setCategoryId(cat.id)}
                keyExtractor={(cat) => cat.id}
                labelExtractor={(cat) => cat.name}
                getItemColor={(cat) => cat.color}
                renderIcon={(cat) => (
                  <CategoryIcon
                    iconName={cat.icon}
                    size={16}
                    color={cat.color}
                  />
                )}
              />
            </View>
          )}

          {/* Payment Method */}
          {availablePaymentMethods.length > 0 && (
            <View style={styles.fieldGroup}>
              <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('transactionModal.paymentMethodField')}
              </AppText>
              <AppChipSelector
                items={availablePaymentMethods}
                selectedId={paymentMethodId}
                onSelect={(pm) => setPaymentMethodId(pm.id === paymentMethodId ? '' : pm.id)}
                keyExtractor={(pm) => pm.id}
                labelExtractor={(pm) => pm.name}
                renderIcon={(_item, active) => (
                  <CreditCard
                    size={14}
                    color={active ? theme.colors.accent : theme.colors.textSecondary}
                  />
                )}
              />
            </View>
          )}

          {/* Bank */}
          {availableBanks.length > 0 && (
            <View style={styles.fieldGroup}>
              <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('transactionModal.bankField')}
              </AppText>
              <AppChipSelector
                items={availableBanks}
                selectedId={bankId}
                onSelect={(bank) => setBankId(bank.id === bankId ? '' : bank.id)}
                keyExtractor={(bank) => bank.id}
                labelExtractor={(bank) => bank.name}
                renderIcon={(_item, activeColor) => (
                  <Building2
                    size={14}
                    color={activeColor ? theme.colors.accent : theme.colors.textSecondary}
                  />
                )}
              />
            </View>
          )}

          {/* Active Status Switch Card */}
          <View
            style={[
              styles.activeCard,
              {
                backgroundColor: theme.colors.surfaceRecessed,
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <View style={styles.activeCardTextContainer}>
              <AppText style={[styles.activeCardTitle, { color: theme.colors.textPrimary }]}>
                {t('subscriptionModal.activeSubscription', { defaultValue: 'Active Subscription' })}
              </AppText>
              <AppText style={[styles.activeCardSubtitle, { color: theme.colors.textSecondary }]}>
                {t('subscriptionModal.activeSubscriptionHint', {
                  defaultValue: 'Automatically generates recurring transactions',
                })}
              </AppText>
            </View>
            <AppSwitch value={active} onValueChange={setActive} />
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('transactionModal.notesField')}
            </AppText>
            <AppTextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('subscriptionModal.notesPlaceholder')}
            />
          </View>

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
                title={saving ? t('transactionModal.saving') : subscription ? t('management.saveChanges') : t('subscriptionModal.addSubscription')}
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
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputText: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
  },
  fieldHint: {
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.input,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  activeCardTextContainer: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  activeCardTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  activeCardSubtitle: {
    fontSize: theme.fontSize.xs,
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
