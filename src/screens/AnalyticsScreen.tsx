import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';
import { MonthlyBreakdownCharts } from '../components/analytics';
import { EvolutionTrendChart } from '../components/charts';
import { DEFAULT_CURRENCY, convertCurrency, formatMoney } from '../utils/currencies';
import { AppCard, AppText } from '../components/ui';
import theme from '../theme';

interface AnalyticsScreenProps {
  transactions: Transaction[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ transactions }) => {
  const { t } = useTranslation();

  // Compute total statistics across all recorded transactions
  let totalIncomeConverted = 0;
  let totalExpenseConverted = 0;

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currencyId, DEFAULT_CURRENCY);
    if (tx.type === 'income') {
      totalIncomeConverted += val;
    } else {
      totalExpenseConverted += val;
    }
  });

  const netOverall = totalIncomeConverted - totalExpenseConverted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Primary Page Header */}
      <View style={styles.header}>
        <AppText style={styles.pageTitle}>{t('analytics.title')}</AppText>
        <AppText style={styles.pageSubtitle}>
          {t('analytics.subtitle')}
        </AppText>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <AppCard style={styles.kpiCard} padding="xl">
          <AppText style={styles.kpiLabel}>{t('analytics.lifetimeIncomes')}</AppText>
          <AppText style={[styles.kpiValue, { color: theme.colors.success }]}>
            +{formatMoney(totalIncomeConverted, DEFAULT_CURRENCY)}
          </AppText>
        </AppCard>

        <AppCard style={styles.kpiCard} padding="xl">
          <AppText style={styles.kpiLabel}>{t('analytics.lifetimeExpenses')}</AppText>
          <AppText style={[styles.kpiValue, { color: theme.colors.danger }]}>
            -{formatMoney(totalExpenseConverted, DEFAULT_CURRENCY)}
          </AppText>
        </AppCard>

        <AppCard style={styles.kpiCard} padding="xl">
          <AppText style={styles.kpiLabel}>{t('analytics.netAccumulated')}</AppText>
          <AppText
            style={[
              styles.kpiValue,
              { color: netOverall >= 0 ? theme.colors.accent : theme.colors.danger },
            ]}
          >
            {formatMoney(netOverall, DEFAULT_CURRENCY)}
          </AppText>
        </AppCard>
      </View>

      {/* Graph 1: Current Month Incomes & Expenses Breakdown */}
      <MonthlyBreakdownCharts transactions={transactions} targetCurrency={DEFAULT_CURRENCY} />

      {/* Graph 2: Evolution by Month */}
      <EvolutionTrendChart transactions={transactions} targetCurrency={DEFAULT_CURRENCY} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing['4xl'],
    gap: theme.spacing.lg,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: theme.spacing.xs,
  },
  pageTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    marginTop: theme.spacing.xxs,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: theme.spacing.base,
    marginVertical: theme.spacing.xs,
  },
  kpiCard: {
    flex: 1,
  },
  kpiLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  kpiValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
  },
});
