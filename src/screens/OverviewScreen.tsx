import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Transaction, TursoConfig } from '../types';
import { DEFAULT_CURRENCY, formatMoney, convertCurrency } from '../utils/currencies';
import { TransactionEditModal } from '../components/TransactionEditModal';
import { Pencil, TrendingDown, TrendingUp } from 'lucide-react-native';
import theme from '../theme';

interface OverviewScreenProps {
  transactions: Transaction[];
  tursoConfig: TursoConfig;
  onNavigateAdd?: () => void;
  onNavigateTransactions: () => void;
  onRefresh: () => void;
}

interface GroupedRecentItem {
  id: string;
  representativeTx: Transaction;
  type: 'income' | 'expense';
  title: string;
  totalAmount: number;
  currency: string;
  category: string;
  paymentMethod?: string;
  store?: string;
  installments?: number;
  date: string;
}

function getGroupedRecentTransactions(allTx: Transaction[], limit: number = 4): GroupedRecentItem[] {
  const groupsMap = new Map<string, Transaction[]>();
  const standaloneItems: Transaction[] = [];

  allTx.forEach((tx) => {
    if (tx.type === 'expense' && tx.installments && tx.installments > 1) {
      const groupKey = tx.installmentGroupId
        ? tx.installmentGroupId
        : `${tx.title.replace(/\s*\(\d+\/\d+\)$/, '').trim().toLowerCase()}_${tx.installments}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey)!.push(tx);
    } else {
      standaloneItems.push(tx);
    }
  });

  const result: GroupedRecentItem[] = [];

  groupsMap.forEach((txList) => {
    txList.sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1));
    const firstInst = txList.find((t) => t.installmentNumber === 1) || txList[0];

    const baseTitle = firstInst.title.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    const installments = firstInst.installments || txList.length;
    const totalAmount = txList.reduce((sum, t) => sum + t.amount, 0);

    result.push({
      id: firstInst.installmentGroupId || firstInst.id,
      representativeTx: firstInst,
      type: firstInst.type,
      title: baseTitle,
      totalAmount: totalAmount > 0 ? totalAmount : firstInst.amount * installments,
      currency: firstInst.currency,
      category: firstInst.category,
      paymentMethod: firstInst.paymentMethod,
      store: firstInst.store,
      installments,
      date: firstInst.date, // Date of the FIRST installment
    });
  });

  standaloneItems.forEach((tx) => {
    result.push({
      id: tx.id,
      representativeTx: tx,
      type: tx.type,
      title: tx.title,
      totalAmount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      store: tx.store,
      installments: tx.installments,
      date: tx.date,
    });
  });

  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return result.slice(0, limit);
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  transactions,
  tursoConfig,
  onNavigateTransactions,
  onRefresh,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const currentMonthDate = new Date();
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();

  let currentMonthIncome = 0;
  let currentMonthExpense = 0;
  let totalNetBalance = 0;

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currency, DEFAULT_CURRENCY);
    if (tx.type === 'income') {
      totalNetBalance += val;
    } else {
      totalNetBalance -= val;
    }

    const txDate = new Date(tx.date);
    if (!isNaN(txDate.getTime()) && txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
      if (tx.type === 'income') {
        currentMonthIncome += val;
      } else {
        currentMonthExpense += val;
      }
    }
  });

  const monthNet = currentMonthIncome - currentMonthExpense;
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });
  const recentItems = getGroupedRecentTransactions(transactions, 4);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Banner & Turso Cloud Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeTitle}>Personal Finances</Text>
          <Text style={styles.welcomeSubtitle}>Cloud-synced financial manager</Text>
        </View>

        {/* Turso Database Connection Pill */}
        <View style={styles.tursoPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: tursoConfig.isConnected ? theme.colors.success : theme.colors.warning },
            ]}
          />
          <Text style={styles.tursoPillText}>
            {tursoConfig.isConnected ? 'Turso Cloud DB' : 'Turso Offline'}
          </Text>
        </View>
      </View>

      {/* Main Net Balance Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Net Balance ({DEFAULT_CURRENCY})</Text>
        <Text style={styles.heroValue}>
          {formatMoney(totalNetBalance, DEFAULT_CURRENCY)}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{monthName} Income</Text>
            <Text style={[styles.metaValue, { color: theme.colors.success }]}>
              +{formatMoney(currentMonthIncome, DEFAULT_CURRENCY)}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{monthName} Expense</Text>
            <Text style={[styles.metaValue, { color: theme.colors.danger }]}>
              -{formatMoney(currentMonthExpense, DEFAULT_CURRENCY)}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={onNavigateTransactions}>
            <Text style={styles.seeAllText}>See all ({transactions.length}) →</Text>
          </TouchableOpacity>
        </View>

        {recentItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No recent transactions.</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentItems.map((item) => {
              const dateObj = new Date(item.date);
              const dateStr = isNaN(dateObj.getTime())
                ? item.date
                : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

              return (
                <View key={item.id} style={styles.recentItem}>
                  <View
                    style={[
                      styles.recentIcon,
                      {
                        backgroundColor:
                          item.type === 'income'
                            ? theme.colors.successBg
                            : theme.colors.dangerBg,
                      },
                    ]}
                  >
                    {item.type === 'income'
                      ? <TrendingUp size={16} color={theme.colors.success} />
                      : <TrendingDown size={16} color={theme.colors.danger} />}
                  </View>

                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>{item.title}</Text>
                    <Text style={styles.recentSub}>
                      {item.category}
                      {item.store ? ` • 🏪 ${item.store}` : ''}
                      {item.paymentMethod ? ` • 💳 ${item.paymentMethod}` : ''}
                      {item.installments && item.installments > 1 ? ` • 📅 Split in ${item.installments}x` : ''}
                      {' • '}{dateStr}
                    </Text>
                  </View>

                  <View style={styles.recentActions}>
                    <Text
                      style={[
                        styles.recentAmount,
                        { color: item.type === 'income' ? theme.colors.success : theme.colors.danger },
                      ]}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatMoney(item.totalAmount, item.currency)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setEditingTransaction(item.representativeTx)}
                      style={styles.editButton}
                      accessibilityLabel={`Edit ${item.title}`}
                    >
                      <Pencil size={12} color={theme.colors.accent} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: theme.spacing.xxs,
  },
  tursoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii['4xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tursoPillText: {
    color: theme.colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['4xl'],
    padding: theme.spacing['6xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  heroLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: theme.colors.textPrimary,
    fontSize: 36,
    fontWeight: '900',
    marginVertical: theme.spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metaBox: {
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing['2xl'],
  },
  metaLabel: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  metaValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: theme.spacing.xxs,
  },
  actionBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing['3xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  actionGraphBtn: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  actionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  section: {
    gap: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing['4xl'],
    borderRadius: theme.radii.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  recentList: {
    gap: theme.spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.xl,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  recentSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 7,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 3,
  },
  editButtonText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
});
