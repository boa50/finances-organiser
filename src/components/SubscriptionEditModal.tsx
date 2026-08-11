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
import { AppButton, AppModal, AppText, AppTextInput, FeedbackMessage } from './ui';
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
                  onPress={() => setCurrency(c.code)}
                >
                  <AppText style={styles.currencyFlag}>{c.flag}</AppText>
                  <AppText
                    style={[
                      styles.currencyText,
                      currency === c.code && styles.currencyTextActive,
                    ]}
                  >
                    {c.code}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {availableCategories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: cat.color + '22', borderColor: cat.color },
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <CategoryIcon iconName={cat.icon} size={16} color={isSelected ? cat.color : theme.colors.textMuted} />
                  <AppText
                    style={[
                      styles.categoryChipText,
                      isSelected && { color: cat.color, fontWeight: theme.fontWeight.bold },
                    ]}
                  >
                    {cat.name}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Payment Method */}
        {availablePaymentMethods.length > 0 && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>Payment Method (Optional)</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {availablePaymentMethods.map((pm) => {
                const isSelected = paymentMethod === pm.name;
                return (
                  <TouchableOpacity
                    key={pm.id}
                    style={[styles.pmChip, isSelected && styles.pmChipActive]}
                    onPress={() => setPaymentMethod(isSelected ? '' : pm.name)}
                  >
                    <AppText
                      style={[
                        styles.pmChipText,
                        isSelected && styles.pmChipTextActive,
                      ]}
                    >
                      {pm.name}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  chipRow: {
    flexDirection: 'row',
    marginVertical: theme.spacing.xs,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginRight: theme.spacing.xs,
    gap: 4,
  },
  currencyChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  currencyFlag: {
    fontSize: theme.fontSize.sm,
  },
  currencyText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  currencyTextActive: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginRight: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  categoryChipText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  pmChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginRight: theme.spacing.xs,
  },
  pmChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  pmChipText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  pmChipTextActive: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
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
