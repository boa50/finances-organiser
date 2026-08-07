import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Transaction } from '../types';
import { formatMoney, getCurrencyInfo } from '../utils/currencies';
import { tursoService } from '../services/tursoService';
import { TransactionEditModal } from '../components/TransactionEditModal';
import { Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react-native';
import theme from '../theme';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

interface HistoryTransactionItemProps {
  transaction: Transaction;
  showMonthHeader: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string, title: string) => void;
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
      <View style={styles.txRow}>
        <View
          style={[
            styles.typeIconBox,
            { backgroundColor: transaction.type === 'income' ? theme.colors.successBg : theme.colors.dangerBg },
          ]}
        >
          {transaction.type === 'income'
            ? <TrendingUp size={20} color={theme.colors.success} />
            : <TrendingDown size={20} color={theme.colors.danger} />}
        </View>
        <View style={styles.txMainInfo}>
          <Text style={styles.txTitle}>{transaction.title}</Text>
          <View style={styles.txMetaRow}>
            <Text style={styles.txCategory}>{transaction.category}</Text>
            {transaction.paymentMethod ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.txPaymentMethod}>💳 {transaction.paymentMethod}</Text>
              </>
            ) : null}
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.txDate}>{formattedDate} {formattedTime}</Text>
          </View>
          {transaction.notes ? <Text style={styles.txNotes}>{transaction.notes}</Text> : null}
        </View>
        <View style={styles.txRightCol}>
          <Text style={[styles.txAmount, { color: transaction.type === 'income' ? theme.colors.success : theme.colors.danger }]}>
            {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount, transaction.currency)}
          </Text>
          <View style={styles.actionsRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>{currencyInfo.flag} {transaction.currency}</Text>
            </View>
            <TouchableOpacity onPress={() => onEdit(transaction)} style={styles.editBtn} accessibilityLabel={`Edit ${transaction.title}`}>
              <Pencil size={14} color={theme.colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(transaction.id, transaction.title)} style={styles.deleteBtn}>
              <Trash2 size={14} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await tursoService.deleteTransaction(id);
      onRefresh();
    }
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTransactions.length} recorded entries
          </Text>
        </View>

        {transactions.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll}>
            <Trash2 size={14} color={theme.colors.danger} />
            <Text style={styles.clearAllBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, category or notes..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'income' && styles.filterTabIncomeActive,
            ]}
            onPress={() => setFilterType('income')}
          >
            <Text style={[styles.filterTabText, filterType === 'income' && styles.filterTabTextActive]}>
              Incomes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'expense' && styles.filterTabExpenseActive,
            ]}
            onPress={() => setFilterType('expense')}
          >
            <Text style={[styles.filterTabText, filterType === 'expense' && styles.filterTabTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List of Transactions */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search query or filter.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredTransactions.map((transaction, index) => (
            <HistoryTransactionItem
              key={transaction.id}
              transaction={transaction}
              showMonthHeader={index === 0 || monthKey(transaction.date) !== monthKey(filteredTransactions[index - 1].date)}
              onEdit={(value) => setEditingTransaction(value)}
              onDelete={handleDelete}
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
    gap: theme.spacing['2xl'],
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xxs,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerBg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.base,
  },
  clearAllBtnText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.base,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.base,
    color: theme.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  filterTabIncomeActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  filterTabExpenseActive: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  filterTabText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing['7xl'],
    borderRadius: theme.radii['2xl'],
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  list: {
    gap: theme.spacing['5xl'],
  },
  monthGroup: {
    gap: theme.spacing.base,
  },
  monthEntry: {
    gap: theme.spacing.base,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: theme.spacing.xxs,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  monthTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  monthCount: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing['2xl'],
    borderRadius: theme.radii.xl,
    gap: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: {
    fontSize: 20,
  },
  txMainInfo: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  txTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  txCategory: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  txPaymentMethod: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dotSeparator: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  txDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  txNotes: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: theme.spacing.xxs,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
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
  currencyBadge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  currencyBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  editBtn: {
    backgroundColor: theme.colors.accentBg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    paddingHorizontal: 7,
    paddingVertical: theme.spacing.xs,
  },
  editBtnText: {
    fontSize: 14,
  },
  deleteBtn: {
    padding: theme.spacing.xxs,
  },
  deleteBtnText: {
    fontSize: 14,
  },
});
