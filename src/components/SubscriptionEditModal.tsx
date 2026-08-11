import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { BankItem, CategoryItem, PaymentMethodItem, Subscription } from '../types';
import { CURRENCIES } from '../utils/currencies';
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
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [category, setCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [bank, setBank] = useState<string>('');
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

      if (subscription) {
        setTitle(subscription.title);
        setAmount(String(subscription.amount));
        setCurrency(subscription.currency || 'BRL');
        setCategory(subscription.category || (cats.length > 0 ? cats[0].name : ''));
        setPaymentMethod(subscription.paymentMethod || '');
        setBank(subscription.bank || '');
        setStore(subscription.store || '');
        setBillingDay(String(subscription.billingDay || 1));
        setActive(subscription.active !== undefined ? subscription.active : true);
        setNotes(subscription.notes || '');
      } else {
        setTitle('');
        setAmount('');
        setCurrency('BRL');
        setCategory(cats.length > 0 ? cats[0].name : '');
        setPaymentMethod(pms.length > 0 ? pms[0].name : '');
        setBank('');
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
      setErrorMessage('Please enter a title for the subscription.');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid monthly amount greater than zero.');
      return;
    }

    if (!category) {
      setErrorMessage('Please select a category.');
      return;
    }

    const numDay = parseInt(billingDay, 10);
    if (isNaN(numDay) || numDay < 1 || numDay > 31) {
      setErrorMessage('Please enter a valid payment day between 1 and 31.');
      return;
    }

    setSaving(true);
    try {
      if (subscription) {
        const oldBillingDay = subscription.billingDay;
        const updated = await subscriptionService.updateSubscription(subscription.id, {
          title: title.trim(),
          amount: numAmount,
          currency,
          category,
          paymentMethod: paymentMethod || undefined,
          bank: bank || undefined,
          store: store.trim() || undefined,
          billingDay: numDay,
          active,
          notes: notes.trim() || undefined,
        });

        // If billing day changed, update current month's transaction date if one exists
        if (oldBillingDay !== numDay) {
          const currentTxs = await tursoService.getTransactions();
          await handleSubscriptionBillingDayUpdate(updated, currentTxs);
        }
      } else {
        await subscriptionService.addSubscription({
          title: title.trim(),
          amount: numAmount,
          currency,
          category,
          paymentMethod: paymentMethod || undefined,
          bank: bank || undefined,
          store: store.trim() || undefined,
          billingDay: numDay,
          active,
          notes: notes.trim() || undefined,
        });
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error saving subscription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={subscription ? 'Edit Subscription' : 'Add Subscription'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {errorMessage && (
          <View style={styles.errorContainer}>
            <FeedbackMessage type="error" message={errorMessage} />
          </View>
        )}

        {/* Title */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>Subscription Title *</AppText>
          <AppTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Netflix, Spotify, Gym, Cloud Hosting"
          />
        </View>

        {/* Amount & Currency */}
        <View style={styles.row}>
          <View style={styles.flex2}>
            <AppText style={styles.label}>Monthly Amount *</AppText>
            <AppTextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
            />
          </View>
          <View style={styles.flex1}>
            <AppText style={styles.label}>Currency</AppText>
            <ChipSelector
              items={CURRENCIES}
              selectedId={currency}
              onSelect={(c) => setCurrency(c.code)}
              keyExtractor={(c) => c.code}
              labelExtractor={(c) => `${c.flag} ${c.code}`}
            />
          </View>
        </View>

        {/* Billing Day */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>Recurrent Payment Day of Month (1 - 31) *</AppText>
          <AppTextInput
            value={billingDay}
            onChangeText={setBillingDay}
            placeholder="1"
          />
          <AppText style={styles.fieldHint}>
            Expenses will be auto-generated every month on or starting on day {billingDay || '1'}.
          </AppText>
        </View>

        {/* Active Toggle */}
        <View style={styles.activeToggleRow}>
          <View style={styles.activeToggleInfo}>
            <AppText style={styles.activeToggleTitle}>Subscription Status</AppText>
            <AppText style={styles.activeToggleSub}>
              {active ? 'Active (auto-generates monthly expense)' : 'Inactive (paused)'}
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
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>Category *</AppText>
          <ChipSelector
            items={availableCategories}
            selectedId={category}
            onSelect={(cat) => setCategory(cat.name)}
            keyExtractor={(cat) => cat.id || cat.name}
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

        {/* Payment Method */}
        {availablePaymentMethods.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>Payment Method (Optional)</AppText>
            <ChipSelector
              items={availablePaymentMethods}
              selectedId={paymentMethod}
              onSelect={(pm) => setPaymentMethod(pm.name === paymentMethod ? '' : pm.name)}
              keyExtractor={(pm) => pm.id || pm.name}
              labelExtractor={(pm) => pm.name}
            />
          </View>
        )}

        {/* Bank */}
        {availableBanks.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>Bank (Optional)</AppText>
            <ChipSelector
              items={availableBanks}
              selectedId={bank}
              onSelect={(b) => setBank(b.name === bank ? '' : b.name)}
              keyExtractor={(b) => b.id || b.name}
              labelExtractor={(b) => b.name}
              renderIcon={(_b, active) => (
                <Building2 size={14} color={active ? theme.colors.accent : theme.colors.textMuted} />
              )}
            />
          </View>
        )}

        {/* Store / Merchant */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>Store / Merchant (Optional)</AppText>
          <AppTextInput
            value={store}
            onChangeText={setStore}
            placeholder="e.g. Netflix Inc."
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>Notes (Optional)</AppText>
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any extra details..."
          />
        </View>

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
              title={saving ? 'Saving...' : subscription ? 'Save Changes' : 'Add Subscription'}
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
    paddingBottom: theme.spacing.lg,
  },
  errorContainer: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 1.5,
  },
  fieldGroup: {
    marginVertical: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  fieldHint: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
    marginBottom: theme.spacing.xs,
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
