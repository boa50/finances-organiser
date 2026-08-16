import React, { useEffect, useState } from 'react';
import {
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
import { handleSubscriptionBillingDayUpdate } from '../../services/subscriptionAutoGenerator';
import { tursoService } from '../../services/tursoService';
import { CategoryIcon } from '../CategoryIcon';
import {
  AppButton,
  AppChipSelector,
  AppModal,
  AppSwitch,
  AppText,
  AppTextInput,
  FeedbackMessage,
} from '../ui';
import { Building2 } from 'lucide-react-native';
import theme from '../../theme';

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
  const [billingDay, setBillingDay] = useState('1');
  const [active, setActive] = useState(true);
  const [store, setStore] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCategories = async () => {
    const cats = await categoryService.getEnabledCategories('expense');
    setAvailableCategories(cats);
    return cats;
  };

  const loadPaymentMethods = async () => {
    const pms = await paymentMethodService.getEnabledPaymentMethods();
    setAvailablePaymentMethods(pms);
    return pms;
  };

  const loadBanks = async () => {
    const bks = await bankService.getEnabledBanks();
    setAvailableBanks(bks);
    return bks;
  };

  const loadCurrencies = async () => {
    const currs = await currencyService.getEnabledCurrencies();
    setAvailableCurrencies(currs);
    return currs;
  };

  useEffect(() => {
    if (!visible) return;

    const init = async () => {
      setErrorMessage(null);
      const cats = await loadCategories();
      const pms = await loadPaymentMethods();
      const bks = await loadBanks();
      const currs = await loadCurrencies();

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
        setBillingDay(String(subscription.billingDay));
        setActive(subscription.active);
        setStore(subscription.store || '');
        setNotes(subscription.notes || '');
      } else {
        setTitle('');
        setAmount('');
        setCurrencyId(currs.length > 0 ? currs[0].code : 'BRL');
        setCategoryId(cats.length > 0 ? cats[0].id : '');
        setPaymentMethodId('');
        setBankId('');
        setBillingDay('1');
        setActive(true);
        setStore('');
        setNotes('');
      }
    };

    init();
  }, [visible, subscription]);

  const handleSave = async () => {
    setErrorMessage(null);
    const parsedAmount = Number(amount.replace(',', '.'));
    const parsedDay = parseInt(billingDay, 10);

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

    setSaving(true);
    try {
      if (subscription) {
        const oldBillingDay = subscription.billingDay;
        const updated = await subscriptionService.updateSubscription(subscription.id, {
          title: title.trim(),
          amount: parsedAmount,
          currencyId,
          categoryId: categoryId || undefined,
          paymentMethodId: paymentMethodId || undefined,
          bankId: bankId || undefined,
          billingDay: parsedDay,
          active,
          store: store.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        // Trigger auto-generator checks if billing day or details changed
        if (oldBillingDay !== parsedDay) {
          const currentTxs = await tursoService.getTransactions();
          await handleSubscriptionBillingDayUpdate(updated, currentTxs);
        }
      } else {
        const created = await subscriptionService.addSubscription({
          title: title.trim(),
          amount: parsedAmount,
          currencyId,
          categoryId: categoryId || undefined,
          paymentMethodId: paymentMethodId || undefined,
          bankId: bankId || undefined,
          billingDay: parsedDay,
          active,
          store: store.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        // Trigger auto-generation for current month if applicable
        if (created.active) {
          const now = new Date();
          const today = now.getDate();
          if (created.billingDay <= today) {
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
            const targetDate = `${monthStr}-${String(created.billingDay).padStart(2, '0')}`;

            await tursoService.addTransaction({
              title: created.title,
              amount: created.amount,
              type: 'expense',
              currencyId: created.currencyId,
              categoryId: created.categoryId,
              paymentMethodId: created.paymentMethodId,
              bankId: created.bankId,
              store: created.store,
              date: targetDate,
              notes: created.notes,
              subscriptionId: created.id,
            });
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
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {errorMessage && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={errorMessage} />
          </View>
        )}

        {/* Title */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>{t('transactionModal.titleField')}</AppText>
          <AppTextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('subscriptionModal.titlePlaceholder')}
          />
        </View>

        {/* Amount & Currency */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.flex2]}>
            <AppText style={styles.label}>{t('transactionModal.amountField')}</AppText>
            <AppTextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
            />
          </View>
        </View>

        {/* Currency selector chips */}
        {availableCurrencies.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>{t('transactionModal.currencyField')}</AppText>
            <AppChipSelector
              items={availableCurrencies}
              selectedId={currencyId}
              onSelect={(item) => setCurrencyId(item.code)}
              keyExtractor={(item) => item.code}
              labelExtractor={(item) => `${item.flag} ${item.code}`}
            />
          </View>
        )}

        {/* Billing Day */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>{t('subscriptionModal.billingDayField')}</AppText>
          <AppTextInput
            value={billingDay}
            onChangeText={setBillingDay}
            placeholder="1"
          />
          <AppText style={styles.fieldHint}>
            {t('subscriptionModal.billingDayHint', { day: billingDay || '1' })}
          </AppText>
        </View>

        {/* Active Toggle */}
        <View style={styles.activeToggleRow}>
          <View style={styles.activeToggleInfo}>
            <AppText style={styles.activeToggleTitle}>{t('subscriptionModal.statusField')}</AppText>
            <AppText style={styles.activeToggleSub}>
              {active ? t('subscriptionModal.activeDesc') : t('subscriptionModal.inactiveDesc')}
            </AppText>
          </View>
          <AppSwitch
            value={active}
            onValueChange={setActive}
          />
        </View>

        {/* Category */}
        {availableCategories.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>{t('transactionModal.categoryField')}</AppText>
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
            <AppText style={styles.label}>{t('transactionModal.paymentMethodField')}</AppText>
            <AppChipSelector
              items={availablePaymentMethods}
              selectedId={paymentMethodId}
              onSelect={(pm) => setPaymentMethodId(pm.id === paymentMethodId ? '' : pm.id)}
              keyExtractor={(pm) => pm.id}
              labelExtractor={(pm) => pm.name}
            />
          </View>
        )}

        {/* Bank */}
        {availableBanks.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>{t('transactionModal.bankField')}</AppText>
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

        {/* Store / Merchant */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>{t('transactionModal.storeField')}</AppText>
          <AppTextInput
            value={store}
            onChangeText={setStore}
            placeholder={t('transactionModal.storePlaceholder')}
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>{t('transactionModal.notesField')}</AppText>
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
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex2: {
    flex: 2,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  fieldHint: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
  activeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  activeToggleInfo: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  activeToggleTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  activeToggleSub: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
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
