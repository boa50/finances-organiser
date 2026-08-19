import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';
import { filterTransactions, parseTransactionDate } from '../utils/financials';
import { convertCurrency, formatMoney, DEFAULT_CURRENCY } from '../utils/currencies';
import { tursoService } from '../services/tursoService';
import { categoryService } from '../services/categoryService';
import { confirmAction } from '../utils/dialogs';
import { TransactionEditModal, TransactionItemCard } from '../components/transactions';
import {
  AppCard,
  AppEmptyState,
  AppSectionHeader,
  AppSegmentedControl,
  AppTextInput,
  AppText,
} from '../components/ui';
import { Search, Trash2 } from 'lucide-react-native';
import theme from '../theme';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

export type TransactionListItem =
  | { type: 'header'; id: string; label: string; netBalance: number }
  | { type: 'transaction'; id: string; data: Transaction };

export function monthKey(dateValue: string): string {
  const date = parseTransactionDate(dateValue);
  return Number.isNaN(date.getTime()) ? 'undated' : `${date.getFullYear()}-${date.getMonth()}`;
}

export function buildFlattenedTransactions(
  transactions: Transaction[],
  locale?: string,
  undatedLabel: string = 'Undated transactions'
): TransactionListItem[] {
  const monthNetMap = new Map<string, number>();
  for (const tx of transactions) {
    const mk = monthKey(tx.date);
    const amount = convertCurrency(tx.amount, tx.currencyId, DEFAULT_CURRENCY);
    const current = monthNetMap.get(mk) || 0;
    const delta = tx.type === 'income' ? amount : -amount;
    monthNetMap.set(mk, current + delta);
  }

  const items: TransactionListItem[] = [];
  let lastMonthKey = '';
  for (const tx of transactions) {
    const mk = monthKey(tx.date);
    if (mk !== lastMonthKey) {
      lastMonthKey = mk;
      const date = parseTransactionDate(tx.date);
      const isValid = !Number.isNaN(date.getTime());
      const label = isValid
        ? date.toLocaleDateString(locale || undefined, { month: 'long', year: 'numeric' })
        : undatedLabel;
      const netBalance = monthNetMap.get(mk) ?? 0;
      items.push({ type: 'header', id: `header-${mk}`, label, netBalance });
    }
    items.push({ type: 'transaction', id: tx.id, data: tx });
  }
  return items;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, {
      type: filterType,
      searchQuery,
      categories: categoryService.getCategoriesSync(),
    });
  }, [transactions, filterType, searchQuery]);

  const flattenedList = useMemo(() => {
    return buildFlattenedTransactions(
      filteredTransactions,
      i18n.language,
      t('transactions.undatedTransactions')
    );
  }, [filteredTransactions, i18n.language, t]);

  const handleEdit = useCallback((transaction: Transaction) => {
    if (transaction.subscriptionId) {
      confirmAction({
        title: t('transactions.subTxEditTitle'),
        message: t('transactions.subTxEditMsg'),
        onConfirm: () => {},
      });
      return;
    }
    setEditingTransaction(transaction);
  }, [t]);

  const handleDuplicate = useCallback(async (transaction: Transaction) => {
    if (transaction.subscriptionId) {
      confirmAction({
        title: t('transactions.subTxEditTitle'),
        message: t('transactions.subTxDuplicateMsg'),
        onConfirm: () => {},
      });
      return;
    }

    try {
      await tursoService.duplicateTransaction(transaction);
      onRefresh();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('transactions.duplicateError'));
    }
  }, [onRefresh, t]);

  const handleDelete = useCallback(async (transaction: Transaction) => {
    if (transaction.installments && transaction.installments > 1) {
      if (Platform.OS === 'web') {
        confirmAction({
          title: t('transactions.deleteInstallmentsTitle'),
          message: t('transactions.deleteInstallmentsWebMsg', {
            title: transaction.title,
            current: transaction.installmentNumber,
            total: transaction.installments,
          }),
          onConfirm: async () => {
            await tursoService.deleteTransactionGroup(
              transaction.installmentGroupId || '',
              transaction
            );
            onRefresh();
          },
        });
      } else {
        Alert.alert(
          t('transactions.deleteInstallmentsTitle'),
          t('transactions.deleteInstallmentsNativeMsg', {
            title: transaction.title,
            current: transaction.installmentNumber,
            total: transaction.installments,
          }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('transactions.deleteOnlyThis'),
              style: 'destructive',
              onPress: async () => {
                await tursoService.deleteTransaction(transaction.id);
                onRefresh();
              },
            },
            {
              text: t('transactions.deleteAllInstallments'),
              style: 'destructive',
              onPress: async () => {
                await tursoService.deleteTransactionGroup(
                  transaction.installmentGroupId || '',
                  transaction
                );
                onRefresh();
              },
            },
          ]
        );
      }
    } else {
      confirmAction({
        title: t('transactions.deleteTransactionTitle'),
        message: t('transactions.deleteTransactionMsg', { title: transaction.title }),
        destructive: true,
        onConfirm: async () => {
          await tursoService.deleteTransaction(transaction.id);
          onRefresh();
        },
      });
    }
  }, [onRefresh, t]);

  const handleClearAll = useCallback(async () => {
    confirmAction({
      title: t('transactions.clearAllTitle'),
      message: t('transactions.clearAllMsg'),
      destructive: true,
      onConfirm: async () => {
        await tursoService.clearAllTransactions();
        onRefresh();
      },
    });
  }, [onRefresh, t]);

  const renderItem = useCallback(({ item }: { item: TransactionListItem }) => {
    if (item.type === 'header') {
      const isPositive = item.netBalance > 0;
      const isNegative = item.netBalance < 0;
      const color = isPositive
        ? theme.colors.success
        : isNegative
        ? theme.colors.danger
        : theme.colors.textSecondary;
      const sign = isPositive ? '+' : isNegative ? '-' : '';
      const formattedNet = `${sign}${formatMoney(Math.abs(item.netBalance), DEFAULT_CURRENCY)}`;

      return (
        <View style={styles.monthHeader}>
          <AppText style={styles.monthTitle} numberOfLines={1}>
            {item.label}
          </AppText>
          <AppText style={[styles.monthNetBalance, { color }]} tabularNums>
            {formattedNet}
          </AppText>
        </View>
      );
    }
    return (
      <View style={styles.cardWrapper}>
        <TransactionItemCard
          transaction={item.data}
          showCurrencyBadge
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </View>
    );
  }, [handleEdit, handleDuplicate, handleDelete]);

  return (
    <>
      <View style={styles.container}>
        {/* Pinned Header & Filter Bar */}
        <View style={styles.fixedHeader}>
          <AppSectionHeader
            title={t('transactions.title')}
            subtitle={t('transactions.recordedEntries', { count: filteredTransactions.length })}
            rightElement={
              transactions.length > 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.clearAllBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleClearAll}
                >
                  <Trash2 size={14} color={theme.colors.danger} />
                  <AppText style={styles.clearAllBtnText}>{t('header.clearAll')}</AppText>
                </Pressable>
              ) : undefined
            }
          />

          {/* Search & Filter Bar */}
          <AppCard style={styles.filterCard} variant="glass" padding="lg">
            <AppTextInput
              placeholder={t('transactions.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={<Search size={16} color={theme.colors.textTertiary} />}
            />

            <AppSegmentedControl<'all' | 'income' | 'expense'>
              options={[
                { label: t('common.all'), value: 'all' },
                {
                  label: t('common.incomes'),
                  value: 'income',
                  selectedBackgroundColor: theme.colors.successBg,
                  selectedBorderColor: theme.colors.success,
                  selectedTextColor: theme.colors.success,
                },
                {
                  label: t('common.expenses'),
                  value: 'expense',
                  selectedBackgroundColor: theme.colors.dangerBg,
                  selectedBorderColor: theme.colors.danger,
                  selectedTextColor: theme.colors.danger,
                },
              ]}
              selectedValue={filterType}
              onSelect={setFilterType}
            />
          </AppCard>
        </View>

        {/* Scrollable FlashList Area */}
        <View style={styles.listWrapper}>
          <FlashList<TransactionListItem>
            data={flattenedList}
            renderItem={renderItem}
            getItemType={(item) => item.type}
            keyExtractor={(item) => item.id}
            drawDistance={Platform.OS === 'web' ? 500 : 300}
            ListEmptyComponent={
              <AppEmptyState
                title={t('transactions.noTransactionsFound')}
                description={t('transactions.noTransactionsDescription')}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>

      <TransactionEditModal
        visible={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSaved={onRefresh}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fixedHeader: {
    paddingHorizontal: theme.spacing['4xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.md,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  listWrapper: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: theme.spacing['4xl'],
    paddingBottom: 110,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    paddingVertical: theme.spacing.xs,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: theme.colors.danger,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  clearAllBtnText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  filterCard: {
    gap: theme.spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  monthTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  monthNetBalance: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: -0.2,
  },
});
