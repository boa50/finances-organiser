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
import { ChartNoAxesCombined, Pencil, Plus, TrendingDown, TrendingUp } from 'lucide-react-native';

interface OverviewScreenProps {
  transactions: Transaction[];
  tursoConfig: TursoConfig;
  onNavigateAdd: () => void;
  onNavigateAnalytics: () => void;
  onNavigateTransactions: () => void;
  onRefresh: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  transactions,
  tursoConfig,
  onNavigateAdd,
  onNavigateAnalytics,
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
  const recentTransactions = transactions.slice(0, 4);

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
              { backgroundColor: tursoConfig.isConnected ? '#10B981' : '#F59E0B' },
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
            <Text style={[styles.metaValue, { color: '#10B981' }]}>
              +{formatMoney(currentMonthIncome, DEFAULT_CURRENCY)}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{monthName} Expense</Text>
            <Text style={[styles.metaValue, { color: '#F43F5E' }]}>
              -{formatMoney(currentMonthExpense, DEFAULT_CURRENCY)}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Grid */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionAddBtn]} onPress={onNavigateAdd}>
          <Plus size={24} color="#10B981" strokeWidth={2} />
          <Text style={styles.actionTitle}>Add Expense / Income</Text>
          <Text style={styles.actionSubtitle}>Include transaction with date & currency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.actionGraphBtn]} onPress={onNavigateAnalytics}>
          <ChartNoAxesCombined size={24} color="#38BDF8" strokeWidth={2} />
          <Text style={styles.actionTitle}>D3.js Analytics</Text>
          <Text style={styles.actionSubtitle}>View evolution graphs & donut breakdown</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={onNavigateTransactions}>
            <Text style={styles.seeAllText}>See all ({transactions.length}) →</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No recent transactions.</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentTransactions.map((tx) => {
              const dateObj = new Date(tx.date);
              const dateStr = isNaN(dateObj.getTime())
                ? tx.date
                : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

              return (
                <View key={tx.id} style={styles.recentItem}>
                  <View
                    style={[
                      styles.recentIcon,
                      {
                        backgroundColor:
                          tx.type === 'income'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(244, 63, 94, 0.15)',
                      },
                    ]}
                  >
                    {tx.type === 'income'
                      ? <TrendingUp size={16} color="#10B981" />
                      : <TrendingDown size={16} color="#F43F5E" />}
                  </View>

                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>{tx.title}</Text>
                    <Text style={styles.recentSub}>
                      {tx.category} • {dateStr}
                    </Text>
                  </View>

                  <View style={styles.recentActions}>
                    <Text
                      style={[
                        styles.recentAmount,
                        { color: tx.type === 'income' ? '#10B981' : '#F43F5E' },
                      ]}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatMoney(tx.amount, tx.currency)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setEditingTransaction(tx)}
                      style={styles.editButton}
                      accessibilityLabel={`Edit ${tx.title}`}
                    >
                      <Pencil size={12} color="#38BDF8" />
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
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    padding: 20,
    gap: 18,
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
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  tursoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tursoPillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  heroLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaBox: {
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  metaValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  actionAddBtn: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  actionGraphBtn: {
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  recentSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  editButtonText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
});
