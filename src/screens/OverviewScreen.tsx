import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Transaction, TursoConfig } from '../types';
import { DEFAULT_CURRENCY } from '../utils/currencies';
import { calculateFinancialSummary, GroupedRecentItem, groupRecentTransactions, parseTransactionDate } from '../utils/financials';
import { TransactionEditModal } from '../components/transactions/TransactionEditModal';
import { TransactionItemCard } from '../components/transactions/TransactionItemCard';
import { NetBalanceHeroCard } from '../components/overview/NetBalanceHeroCard';
import { AppBadge, AppEmptyState, AppSectionHeader, AppText } from '../components/ui';
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, Plus } from 'lucide-react-native';
import theme from '../theme';

interface OverviewScreenProps {
  transactions: Transaction[];
  tursoConfig: TursoConfig;
  onNavigateTransactions: () => void;
  onRefresh: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  transactions,
  tursoConfig,
  onNavigateTransactions,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransactionModalVisible, setNewTransactionModalVisible] = useState(false);

  const { last60DaysNetBalance, currentMonthIncome, currentMonthExpense } = useMemo(() => {
    return calculateFinancialSummary(transactions, DEFAULT_CURRENCY);
  }, [transactions]);

  const nonSubscriptionTransactions = useMemo(() => {
    return transactions.filter((tx) => !tx.subscriptionId);
  }, [transactions]);

  const recentItems = useMemo(() => {
    return groupRecentTransactions(nonSubscriptionTransactions, 7);
  }, [nonSubscriptionTransactions]);

  const currentMonthDate = new Date();
  const monthName = currentMonthDate.toLocaleString(i18n.language || undefined, { month: 'long' });

  const renderRecentItem = useCallback(({ item }: { item: GroupedRecentItem }) => {
    const dateObj = parseTransactionDate(item.date);
    const dateStr = isNaN(dateObj.getTime())
      ? item.date
      : dateObj.toLocaleDateString(i18n.language || undefined, { month: 'short', day: 'numeric' });

    return (
      <View style={styles.cardWrapper}>
        <TransactionItemCard
          transaction={item.representativeTx}
          title={item.title}
          amountToDisplay={item.totalAmount}
          installmentsLabel={item.installments && item.installments > 1 ? `${item.installments}x` : ''}
          dateString={dateStr}
          onEdit={(tx) => setEditingTransaction(tx)}
        />
      </View>
    );
  }, [i18n.language]);

  return (
    <>
      <View style={styles.container}>
        {/* Pinned Top Section: Header, Hero Card & Quick Actions */}
        <View style={styles.fixedHeader}>
          {/* Header Banner & Turso Cloud Badge */}
          <View style={styles.header}>
            <View>
              <AppText style={styles.welcomeTitle}>{t('overview.title')}</AppText>
              <AppText style={styles.welcomeSubtitle}>{t('overview.subtitle')}</AppText>
            </View>

            <AppBadge
              label={tursoConfig.isConnected ? t('overview.tursoDb') : t('overview.tursoOffline')}
              variant={tursoConfig.isConnected ? 'success' : 'warning'}
              statusDot
              size="sm"
            />
          </View>

          {/* Main Net Balance Hero Card */}
          <NetBalanceHeroCard
            netBalance={last60DaysNetBalance}
            income={currentMonthIncome}
            expense={currentMonthExpense}
            currency={DEFAULT_CURRENCY}
            monthName={monthName}
          />

          {/* Recent Activity Section Header */}
          <AppSectionHeader
            title={t('overview.recentActivity')}
            actionLabel={t('overview.seeAll', { count: nonSubscriptionTransactions.length })}
            onActionPress={onNavigateTransactions}
          />
        </View>

        {/* Scrollable List for Recent Activity */}
        <View style={styles.listWrapper}>
          <FlashList<GroupedRecentItem>
            data={recentItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={<AppEmptyState title={t('overview.noRecentTransactions')} />}
            renderItem={renderRecentItem}
          />
        </View>
      </View>

      <TransactionEditModal
        visible={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSaved={onRefresh}
      />

      <TransactionEditModal
        visible={newTransactionModalVisible}
        transaction={null}
        onClose={() => setNewTransactionModalVisible(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginVertical: 2,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    borderRadius: theme.radii.pill,
    paddingVertical: 9,
    paddingHorizontal: theme.spacing.md,
  },
  quickActionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
});
