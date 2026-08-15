import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Transaction, TursoConfig } from '../types';
import { DEFAULT_CURRENCY, formatMoney } from '../utils/currencies';
import { calculateFinancialSummary, GroupedRecentItem, groupRecentTransactions } from '../utils/financials';
import { TransactionEditModal } from '../components/TransactionEditModal';
import { TransactionItemCard } from '../components/TransactionItemCard';
import { AppBadge, AppCard, AppEmptyState, AppSectionHeader } from '../components/ui';
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
              <Text style={styles.welcomeTitle}>{t('overview.title')}</Text>
              <Text style={styles.welcomeSubtitle}>{t('overview.subtitle')}</Text>
            </View>

            <AppBadge
              label={tursoConfig.isConnected ? t('overview.tursoDb') : t('overview.tursoOffline')}
              variant={tursoConfig.isConnected ? 'success' : 'warning'}
              statusDot
            />
          </View>

          {/* Main Net Balance Hero Card */}
          <AppCard variant="elevated" padding="6xl">
            <Text style={styles.heroLabel}>
              {t('overview.netBalance60Days', { currency: DEFAULT_CURRENCY })}
            </Text>
            <Text style={styles.heroValue}>
              {formatMoney(last60DaysNetBalance, DEFAULT_CURRENCY)}
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>{t('overview.income', { month: monthName })}</Text>
                <Text style={[styles.metaValue, { color: theme.colors.success }]}>
                  +{formatMoney(currentMonthIncome, DEFAULT_CURRENCY)}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>{t('overview.expense', { month: monthName })}</Text>
                <Text style={[styles.metaValue, { color: theme.colors.danger }]}>
                  -{formatMoney(currentMonthExpense, DEFAULT_CURRENCY)}
                </Text>
              </View>
            </View>
          </AppCard>

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
  heroLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.black,
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
    fontSize: theme.fontSize.sm,
  },
  metaValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.xxs,
  },
});
