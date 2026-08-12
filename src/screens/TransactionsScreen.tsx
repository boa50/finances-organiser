import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Transaction } from '../types';
import { filterTransactions } from '../utils/financials';
import { tursoService } from '../services/tursoService';
import { confirmAction } from '../utils/dialogs';
import { TransactionEditModal } from '../components/TransactionEditModal';
import { TransactionItemCard } from '../components/TransactionItemCard';
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

function monthKey(dateValue: string): string {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'undated' : `${date.getFullYear()}-${date.getMonth()}`;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = filterTransactions(transactions, {
    type: filterType,
    searchQuery,
  });

  const handleEdit = (transaction: Transaction) => {
    if (transaction.subscriptionId) {
      confirmAction({
        title: 'Subscription Transaction',
        message:
          'Subscription expenses cannot be edited directly from Transaction History. Please edit the subscription on the Subscriptions management page.',
        onConfirm: () => {},
      });
      return;
    }
    setEditingTransaction(transaction);
  };

  const handleDelete = async (transaction: Transaction) => {
    if (transaction.installments && transaction.installments > 1) {
      if (Platform.OS === 'web') {
        confirmAction({
          title: 'Delete Installments',
          message: `"${transaction.title}" is part of an installment plan (${transaction.installmentNumber}/${transaction.installments}).\n\nClick OK to delete ALL installments in this group, or Cancel to delete ONLY this single installment.`,
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
          'Delete Installment',
          `"${transaction.title}" is installment ${transaction.installmentNumber} of ${transaction.installments}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Only This',
              style: 'destructive',
              onPress: async () => {
                await tursoService.deleteTransaction(transaction.id);
                onRefresh();
              },
            },
            {
              text: 'Delete All Installments',
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
        title: 'Delete Transaction',
        message: `Are you sure you want to delete "${transaction.title}"?`,
        destructive: true,
        onConfirm: async () => {
          await tursoService.deleteTransaction(transaction.id);
          onRefresh();
        },
      });
    }
  };

  const handleClearAll = async () => {
    confirmAction({
      title: 'Clear All Transactions',
      message: 'Are you sure you want to clear ALL transactions? This will permanently remove all expense and income records from your database.',
      destructive: true,
      onConfirm: async () => {
        await tursoService.clearAllTransactions();
        onRefresh();
      },
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <AppSectionHeader
          title="Transaction History"
          subtitle={`${filteredTransactions.length} recorded entries`}
          rightElement={
            transactions.length > 0 ? (
              <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll}>
                <Trash2 size={14} color={theme.colors.danger} />
                <AppText style={styles.clearAllBtnText}>Clear All</AppText>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Search & Filter Bar */}
        <AppCard style={styles.filterCard} padding="lg">
          <AppTextInput
            placeholder="Search by title, category or notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search size={16} color={theme.colors.textTertiary} />}
          />

          <AppSegmentedControl<'all' | 'income' | 'expense'>
            options={[
              { label: 'All', value: 'all' },
              { label: 'Incomes', value: 'income' },
              { label: 'Expenses', value: 'expense' },
            ]}
            selectedValue={filterType}
            onSelect={setFilterType}
          />
        </AppCard>

        {/* List of Transactions */}
        {filteredTransactions.length === 0 ? (
          <AppEmptyState
            title="No transactions found"
            description="Try adjusting your search query or filter."
          />
        ) : (
          <View style={styles.list}>
            {filteredTransactions.map((transaction, index) => {
              const showMonthHeader =
                index === 0 ||
                monthKey(transaction.date) !== monthKey(filteredTransactions[index - 1].date);
              const date = new Date(transaction.date);
              const isValidDate = !Number.isNaN(date.getTime());
              const monthLabel = isValidDate
                ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                : 'Undated transactions';

              return (
                <View key={transaction.id} style={styles.monthEntry}>
                  {showMonthHeader && (
                    <View style={styles.monthHeader}>
                      <AppText style={styles.monthTitle}>{monthLabel}</AppText>
                    </View>
                  )}
                  <TransactionItemCard
                    transaction={transaction}
                    showCurrencyBadge
                    onEdit={handleEdit}
                    onDelete={(tx) => handleDelete(tx)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

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
  contentContainer: {
    padding: theme.spacing['4xl'],
    paddingBottom: 88,
    gap: theme.spacing['3xl'],
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
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
    borderRadius: theme.radii.md,
  },
  clearAllBtnText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  filterCard: {
    gap: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.lg,
  },
  monthEntry: {
    gap: theme.spacing.sm,
  },
  monthHeader: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  monthTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
});
