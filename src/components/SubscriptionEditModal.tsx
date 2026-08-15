import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankItem, CategoryItem, CurrencyInfo, PaymentMethodItem, Subscription } from '../types';
import { currencyService } from '../services/currencyService';
import { categoryService } from '../services/categoryService';
import { paymentMethodService } from '../services/paymentMethodService';
import { bankService } from '../services/bankService';
import { subscriptionService } from '../services/subscriptionService';
import { handleSubscriptionBillingDayUpdate } from '../services/subscriptionAutoGenerator';
import { tursoService } from '../services/tursoService';
import { CategoryIcon } from './CategoryIcon';
import { ChipSelector } from './ChipSelector';
import { AppButton, AppModal, AppText, AppTextInput, FeedbackMessage } from './ui';
import { Building2 } from 'lucide-react-native';
import theme from '../theme';

interface SubscriptionEditModalProps {
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
  const [store, setStore] = useState('');
  const [billingDay, setBillingDay] = useState<string>('1');
  const [active, setActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const initModal = async () => {
      setErrorMessage(null);
      const cats = await categoryService.getCategories('expense');
      setAvailableCategories(cats);
      const pms = await paymentMethodService.getPaymentMethods();
      setAvailablePaymentMethods(pms);
      const bks = await bankService.getBanks();
      setAvailableBanks(bks);
      const currs = await currencyService.getCurrencies();
      setAvailableCurrencies(currs);

      if (subscription) {
        setTitle(subscription.title);
        setAmount(String(subscription.amount));
        setCurrencyId(subscription.currencyId || 'BRL');

        const initialCatId = subscription.categoryId || '';
        setCategoryId(initialCatId);

        const initialPmId = subscription.paymentMethodId || '';
        setPaymentMethodId(initialPmId);

        const initialBankId = subscription.bankId || '';
        setBankId(initialBankId);

        setStore(subscription.store || '');
        setBillingDay(String(subscription.billingDay || 1));
        setActive(subscription.active !== undefined ? subscription.active : true);
        setNotes(subscription.notes || '');
      } else {
        setTitle('');
        setAmount('');
        setCurrencyId(currs.length > 0 ? currs[0].code : 'BRL');
        setCategoryId(cats.length > 0 ? cats[0].id : '');
        setPaymentMethodId(pms.length > 0 ? pms[0].id : '');
        setBankId('');
        setStore('');
        setBillingDay('1');
        setActive(true);
        setNotes('');
      }
    };

    initModal();
  }, [visible, subscription]);

  const handleSave = async () => {
    setErrorMessage(null);
    if (!title.trim()) {
      setErrorMessage(t('subscriptionModal.titleRequired'));
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage(t('subscriptionModal.amountRequired'));
      return;
    }

    const numDay = parseInt(billingDay, 10);
    if (isNaN(numDay) || numDay < 1 || numDay > 31) {
      setErrorMessage(t('subscriptionModal.billingDayRequired'));
      return;
    }

    setSaving(true);
    try {
      const subPayload = {
        title: title.trim(),
        amount: numAmount,
        currencyId,
        categoryId: categoryId || undefined,
        paymentMethodId: paymentMethodId || undefined,
        bankId: bankId || undefined,
        store: store.trim() || undefined,
        billingDay: numDay,
        active,
        notes: notes.trim() || undefined,
      };

      if (subscription) {
        const oldBillingDay = subscription.billingDay;
        const updated = await subscriptionService.updateSubscription(subscription.id, subPayload);

        if (oldBillingDay !== numDay) {
          const currentTxs = await tursoService.getTransactions();
          await handleSubscriptionBillingDayUpdate(updated, currentTxs);
        }
      } else {
        await subscriptionService.addSubscription(subPayload);
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
      title={subscription ? t('subscriptionModal.editSubscription') : t('subscriptionModal.addSubscription')}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {errorMessage && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={errorMessage} />
          </View>
        )}

        {/* Title */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>{t('subscriptionModal.titleField')}</AppText>
          <AppTextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('subscriptionModal.titlePlaceholder')}
          />
        </View>

        {/* Amount & Currency */}
        <View style={styles.row}>
          <View style={styles.flex2}>
            <AppText style={styles.label}>{t('subscriptionModal.amountField')}</AppText>
            <AppTextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
            />
          </View>
          {availableCurrencies.length > 0 && (
            <View style={styles.flex1}>
              <AppText style={styles.label}>{t('transactionModal.currencyField')}</AppText>
              <ChipSelector
                items={availableCurrencies}
                selectedId={currencyId}
                onSelect={(c) => setCurrencyId(c.code)}
                keyExtractor={(c) => c.code}
                labelExtractor={(c) => `${c.flag} ${c.code}`}
              />
            </View>
          )}
        </View>

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
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: theme.colors.borderSubtle, true: theme.colors.success }}
            thumbColor={theme.colors.white}
          />
        </View>

        {/* Category */}
        {availableCategories.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>{t('transactionModal.categoryField')}</AppText>
            <ChipSelector
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
            <ChipSelector
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
            <ChipSelector
              items={availableBanks}
              selectedId={bankId}
              onSelect={(b) => setBankId(b.id === bankId ? '' : b.id)}
              keyExtractor={(b) => b.id}
              labelExtractor={(b) => b.name}
              renderIcon={(_b, active) => (
                <Building2 size={14} color={active ? theme.colors.accent : theme.colors.textMuted} />
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
            placeholder={t('subscriptionModal.storePlaceholder')}
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
  flex1: {
    flex: 1,
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
