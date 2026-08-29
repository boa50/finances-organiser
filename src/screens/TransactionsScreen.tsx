import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
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
  AppText,
  AppTextInput,
} from '../components/ui';
import { Search, Trash2 } from 'lucide-react-native';
import theme, { useTheme } from '../theme';
import { useToast } from '../contexts';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onRefresh: () => void | Promise<void>;
  onLoadMore?: (offset?: number) => void | Promise<void>;
  isLoadingMore?: boolean;
  isFullyLoaded?: boolean;
  totalCount?: number;
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

export function findCurrentMonthIndex(
  items: TransactionListItem[],
  referenceDate: Date = new Date()
): number {
  if (!items || items.length === 0) return -1;
  const currentKey = `${referenceDate.getFullYear()}-${referenceDate.getMonth()}`;
  const currentHeaderId = `header-${currentKey}`;

  // 1. Check exact match for header of current month
  const exactIndex = items.findIndex(
    (item) => item.type === 'header' && item.id === currentHeaderId
  );
  if (exactIndex !== -1) return exactIndex;

  // 2. If no exact current month header exists, find the first month header with date <= referenceDate (most recent month <= current)
  const targetTime = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1
  ).getTime();

  const fallbackIndex = items.findIndex((item) => {
    if (item.type === 'header') {
      const parts = item.id.replace('header-', '').split('-');
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) {
          const itemTime = new Date(year, month, 1).getTime();
          return itemTime <= targetTime;
        }
      }
    }
    return false;
  });

  return fallbackIndex !== -1 ? fallbackIndex : 0;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onRefresh,
  onLoadMore,
  isLoadingMore = false,
  isFullyLoaded = false,
  totalCount,
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { showToast, updateToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [serverSearchResults, setServerSearchResults] = useState<Transaction[] | null>(null);
  const [serverSearchTotal, setServerSearchTotal] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const flashListRef = useRef<FlashListRef<TransactionListItem>>(null);
  const hasAutoScrolledRef = useRef(false);

  // Debounced server-side search when not all transactions are loaded locally
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setServerSearchResults(null);
      setServerSearchTotal(null);
      setIsSearching(false);
      return;
    }

    if (isFullyLoaded) {
      setServerSearchResults(null);
      setServerSearchTotal(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await tursoService.searchTransactionsRemote(query, filterType, 100);
        setServerSearchResults(res.transactions);
        setServerSearchTotal(res.total);
      } catch (err) {
        console.warn('Error during server transaction search:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filterType, isFullyLoaded]);

  const filteredTransactions = useMemo(() => {
    if (serverSearchResults !== null) {
      return serverSearchResults;
    }
    return filterTransactions(transactions, {
      type: filterType,
      searchQuery,
      categories: categoryService.getCategoriesSync(),
    });
  }, [serverSearchResults, transactions, filterType, searchQuery]);

  const flattenedList = useMemo(() => {
    return buildFlattenedTransactions(
      filteredTransactions,
      i18n.language,
      t('transactions.undatedTransactions')
    );
  }, [filteredTransactions, i18n.language, t]);

  useEffect(() => {
    if (
      hasAutoScrolledRef.current ||
      flattenedList.length === 0 ||
      searchQuery.trim() ||
      filterType !== 'all'
    ) {
      return;
    }

    const targetIndex = findCurrentMonthIndex(flattenedList);
    if (targetIndex > 0) {
      hasAutoScrolledRef.current = true;
      const timer = setTimeout(() => {
        try {
          flashListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
          });
        } catch (err) {
          // Fallback if FlashList is not yet measured
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [flattenedList, searchQuery, filterType]);

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

    const toastId = showToast({ type: 'loading', message: t('toast.duplicating') });
    try {
      await tursoService.duplicateTransaction(transaction);
      updateToast(toastId, { type: 'success', message: t('toast.duplicated') });
      await onRefresh();
    } catch (error: any) {
      updateToast(toastId, { type: 'error', message: error?.message || t('toast.duplicateError') });
    }
  }, [onRefresh, showToast, updateToast, t]);

  const handleDelete = useCallback(async (transaction: Transaction) => {
    const executeDelete = async (deleteFn: () => Promise<unknown>) => {
      const toastId = showToast({ type: 'loading', message: t('toast.deleting') });
      try {
        await deleteFn();
        updateToast(toastId, { type: 'success', message: t('toast.deleted') });
        await onRefresh();
      } catch (err: any) {
        updateToast(toastId, { type: 'error', message: err?.message || t('toast.deleteError') });
      }
    };

    if (transaction.installments && transaction.installments > 1) {
      confirmAction({
        title: t('transactions.deleteInstallmentsTitle'),
        message: t('transactions.deleteInstallmentsMsg', {
          title: transaction.title,
          current: transaction.installmentNumber,
          total: transaction.installments,
        }),
        destructive: true,
        onConfirm: () =>
          executeDelete(() =>
            tursoService.deleteTransactionGroup(
              transaction.installmentGroupId || '',
              transaction
            )
          ),
      });
    } else {
      confirmAction({
        title: t('transactions.deleteTransactionTitle'),
        message: t('transactions.deleteTransactionMsg', { title: transaction.title }),
        destructive: true,
        onConfirm: () => executeDelete(() => tursoService.deleteTransaction(transaction.id)),
      });
    }
  }, [onRefresh, showToast, updateToast, t]);

  const handleClearAll = useCallback(async () => {
    confirmAction({
      title: t('transactions.clearAllTitle'),
      message: t('transactions.clearAllMsg'),
      destructive: true,
      onConfirm: async () => {
        const toastId = showToast({ type: 'loading', message: t('toast.clearingAll') });
        try {
          await tursoService.clearAllTransactions();
          updateToast(toastId, { type: 'success', message: t('toast.clearedAll') });
          await onRefresh();
        } catch (err: any) {
          updateToast(toastId, { type: 'error', message: err?.message || t('toast.deleteError') });
        }
      },
    });
  }, [onRefresh, showToast, updateToast, t]);

  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && !isFullyLoaded && onLoadMore && !searchQuery.trim()) {
      onLoadMore(transactions.length);
    }
  }, [isLoadingMore, isFullyLoaded, onLoadMore, searchQuery, transactions.length]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore && !isSearching) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.textTertiary} />
      </View>
    );
  }, [isLoadingMore, isSearching, theme.colors.textTertiary]);

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
          <AppText style={[styles.monthTitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
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
  }, [handleEdit, handleDuplicate, handleDelete, theme.colors]);

  const displayedCount =
    serverSearchTotal !== null
      ? serverSearchTotal
      : searchQuery.trim() || filterType !== 'all'
      ? filteredTransactions.length
      : totalCount !== undefined && totalCount > transactions.length
      ? totalCount
      : filteredTransactions.length;

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Pinned Header & Filter Bar */}
        <View style={styles.fixedHeader}>
          <AppSectionHeader
            title={t('transactions.title')}
            subtitle={t('transactions.recordedEntries', { count: displayedCount })}
            rightElement={
              transactions.length > 0 ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.clearAllBtn,
                    {
                      backgroundColor: theme.colors.dangerBg,
                      borderColor: theme.colors.danger,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={handleClearAll}
                >
                  <Trash2 size={14} color={theme.colors.danger} />
                  <AppText style={[styles.clearAllBtnText, { color: theme.colors.danger }]}>
                    {t('header.clearAll')}
                  </AppText>
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
            ref={flashListRef}
            data={flattenedList}
            renderItem={renderItem}
            getItemType={(item) => item.type}
            keyExtractor={(item) => item.id}
            drawDistance={Platform.OS === 'web' ? 500 : 300}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
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
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  clearAllBtnText: {
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
  loadingFooter: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
