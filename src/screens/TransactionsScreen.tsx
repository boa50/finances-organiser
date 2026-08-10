import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Transaction } from '../types';
import { formatMoney, getCurrencyInfo } from '../utils/currencies';
import { filterTransactions } from '../utils/financials';
import { tursoService } from '../services/tursoService';
import { TransactionEditModal } from '../components/TransactionEditModal';
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppIconBadge,
  AppSectionHeader,
  AppSegmentedControl,
  AppTextInput,
} from '../components/ui';
import { Pencil, Search, Trash2, TrendingDown, TrendingUp } from 'lucide-react-native';
import theme from '../theme';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

interface HistoryTransactionItemProps {
  transaction: Transaction;
  showMonthHeader: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const HistoryTransactionItem: React.FC<HistoryTransactionItemProps> = ({
  transaction,
  showMonthHeader,
  onEdit,
  onDelete,
}) => {
  const currencyInfo = getCurrencyInfo(transaction.currency);
  const date = new Date(transaction.date);
  const isValidDate = !Number.isNaN(date.getTime());
  const monthLabel = isValidDate
    ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Undated transactions';
  const formattedDate = isValidDate
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : transaction.date;
  const formattedTime = isValidDate
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.monthEntry}>
      {showMonthHeader && (
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
        </View>
      )}
      <AppCard style={styles.txRow} padding="lg">
        <AppIconBadge
          icon={
            transaction.type === 'income' ? (
              <TrendingUp size={18} color={theme.colors.success} />
            ) : (
              <TrendingDown size={18} color={theme.colors.danger} />
            )
          }
          variant={transaction.type === 'income' ? 'success' : 'danger'}
          size="md"
        />

        <View style={styles.txMainInfo}>
          <Text style={styles.txTitle}>{transaction.title}</Text>
          <View style={styles.txMetaRow}>
            <Text style={styles.txCategory}>{transaction.category}</Text>
            {transaction.store ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.txStore}>🏪 {transaction.store}</Text>
              </>
            ) : null}
            {transaction.paymentMethod ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.txPaymentMethod}>💳 {transaction.paymentMethod}</Text>
              </>
            ) : null}
            {transaction.installments && transaction.installments > 1 ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.txInstallment}>
                  📅 {transaction.installmentNumber}/{transaction.installments}
                </Text>
              </>
            ) : null}
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.txDate}>
              {formattedDate} {formattedTime}
            </Text>
          </View>
          {transaction.notes ? <Text style={styles.txNotes}>{transaction.notes}</Text> : null}
        </View>

        <View style={styles.txRightCol}>
          <Text
            style={[
              styles.txAmount,
              { color: transaction.type === 'income' ? theme.colors.success : theme.colors.danger },
            ]}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatMoney(transaction.amount, transaction.currency)}
          </Text>

          <View style={styles.actionsRow}>
            <AppBadge
              label={`${currencyInfo.flag} ${transaction.currency}`}
              variant="neutral"
              size="sm"
            />

            <TouchableOpacity
              onPress={() => onEdit(transaction)}
              style={styles.editBtn}
              accessibilityLabel={`Edit ${transaction.title}`}
            >
              <Pencil size={14} color={theme.colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onDelete(transaction)} style={styles.deleteBtn}>
              <Trash2 size={14} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </AppCard>
    </View>
  );
};

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

  const handleDelete = async (transaction: Transaction) => {
    if (transaction.installments && transaction.installments > 1) {
      if (Platform.OS === 'web') {
        const choice = confirm(
          `"${transaction.title}" is part of an installment plan (${transaction.installmentNumber}/${transaction.installments}).\n\nClick OK to delete ALL installments in this group, or Cancel to delete ONLY this single installment.`
        );
        if (choice) {
          await tursoService.deleteTransactionGroup(
            transaction.installmentGroupId || '',
            transaction
          );
        } else {
          if (
            confirm(
              `Delete ONLY installment ${transaction.installmentNumber}/${transaction.installments}?`
            )
          ) {
            await tursoService.deleteTransaction(transaction.id);
          } else {
            return;
          }
        }
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
        return;
      }
    } else {
      if (confirm(`Are you sure you want to delete "${transaction.title}"?`)) {
        await tursoService.deleteTransaction(transaction.id);
      } else {
        return;
      }
    }
    onRefresh();
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Are you sure you want to clear ALL transactions? This will permanently remove all expense and income records from your database.'
      )
    ) {
      await tursoService.clearAllTransactions();
      onRefresh();
    }
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
                <Text style={styles.clearAllBtnText}>Clear All</Text>
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
            {filteredTransactions.map((transaction, index) => (
              <HistoryTransactionItem
                key={transaction.id}
                transaction={transaction}
                showMonthHeader={
                  index === 0 ||
                  monthKey(transaction.date) !== monthKey(filteredTransactions[index - 1].date)
                }
                onEdit={(tx) => setEditingTransaction(tx)}
                onDelete={(tx) => handleDelete(tx)}
              />
            ))}
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
    gap: 5,
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.base,
  },
  clearAllBtnText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    gap: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.lg,
  },
  monthEntry: {
    gap: theme.spacing.md,
  },
  monthHeader: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  monthTitle: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  txMainInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  txCategory: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  txStore: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  txPaymentMethod: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  txInstallment: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  txDate: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  dotSeparator: {
    color: theme.colors.textTertiary,
    fontSize: 10,
  },
  txNotes: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  editBtn: {
    padding: theme.spacing.xs,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
});
