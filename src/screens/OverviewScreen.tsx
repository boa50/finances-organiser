import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Transaction, TursoConfig } from '../types';
import { DEFAULT_CURRENCY } from '../utils/currencies';
import { calculateFinancialSummary, GroupedRecentItem, groupRecentTransactions } from '../utils/financials';
import { TransactionEditModal } from '../components/transactions/TransactionEditModal';
import { TransactionItemCard } from '../components/transactions/TransactionItemCard';
import { NetBalanceHeroCard } from '../components/overview/NetBalanceHeroCard';
import { AppBadge, AppEmptyState, AppSectionHeader, AppText } from '../components/ui';
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
    const dateObj = new Date(item.date);
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
        {/* Pinned Top Section: Header, Hero Card & Recent Activity Header */}
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
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.lg,
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
    paddingBottom: 88,
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
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
  },
  welcomeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    marginTop: theme.spacing.xxs,
  },
});
