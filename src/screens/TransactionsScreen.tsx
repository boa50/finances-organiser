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
            { backgroundColor: transaction.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' },
          ]}
        >
          {transaction.type === 'income'
            ? <TrendingUp size={20} color="#10B981" />
            : <TrendingDown size={20} color="#F43F5E" />}
        </View>
        <View style={styles.txMainInfo}>
          <Text style={styles.txTitle}>{transaction.title}</Text>
          <View style={styles.txMetaRow}>
            <Text style={styles.txCategory}>{transaction.category}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.txDate}>{formattedDate} {formattedTime}</Text>
          </View>
          {transaction.notes ? <Text style={styles.txNotes}>{transaction.notes}</Text> : null}
        </View>
        <View style={styles.txRightCol}>
          <Text style={[styles.txAmount, { color: transaction.type === 'income' ? '#10B981' : '#F43F5E' }]}>
            {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount, transaction.currency)}
          </Text>
          <View style={styles.actionsRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>{currencyInfo.flag} {transaction.currency}</Text>
            </View>
            <TouchableOpacity onPress={() => onEdit(transaction)} style={styles.editBtn} accessibilityLabel={`Edit ${transaction.title}`}>
              <Pencil size={14} color="#38BDF8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(transaction.id, transaction.title)} style={styles.deleteBtn}>
              <Trash2 size={14} color="#F43F5E" />
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
            <Trash2 size={14} color="#F43F5E" />
            <Text style={styles.clearAllBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, category or notes..."
          placeholderTextColor="#64748B"
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
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    padding: 20,
    gap: 16,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#F43F5E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearAllBtnText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterTabActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  filterTabIncomeActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterTabExpenseActive: {
    backgroundColor: '#F43F5E',
    borderColor: '#F43F5E',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
  },
  list: {
    gap: 22,
  },
  monthGroup: {
    gap: 10,
  },
  monthEntry: {
    gap: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  monthCount: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: {
    fontSize: 20,
  },
  txMainInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txCategory: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  dotSeparator: {
    color: '#64748B',
    fontSize: 12,
  },
  txDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  txNotes: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currencyBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  editBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  editBtnText: {
    fontSize: 14,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteBtnText: {
    fontSize: 14,
  },
});
