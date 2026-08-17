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
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react-native';
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
        <AppCard style={styles.kpiCard} variant="glass" padding="xl">
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconBadge, { backgroundColor: theme.colors.successBg }]}>
              <ArrowUpRight size={14} color={theme.colors.success} strokeWidth={2.5} />
            </View>
            <AppText style={styles.kpiLabel}>{t('analytics.lifetimeIncomes')}</AppText>
          </View>
          <AppText style={[styles.kpiValue, { color: theme.colors.success }]} tabularNums>
            +{formatMoney(totalIncomeConverted, DEFAULT_CURRENCY)}
          </AppText>
        </AppCard>

        <AppCard style={styles.kpiCard} variant="glass" padding="xl">
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconBadge, { backgroundColor: theme.colors.dangerBg }]}>
              <ArrowDownLeft size={14} color={theme.colors.danger} strokeWidth={2.5} />
            </View>
            <AppText style={styles.kpiLabel}>{t('analytics.lifetimeExpenses')}</AppText>
          </View>
          <AppText style={[styles.kpiValue, { color: theme.colors.danger }]} tabularNums>
            -{formatMoney(totalExpenseConverted, DEFAULT_CURRENCY)}
          </AppText>
        </AppCard>

        <AppCard style={styles.kpiCard} variant="glass" padding="xl">
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconBadge, { backgroundColor: theme.colors.accentBg }]}>
              <Scale size={14} color={theme.colors.accent} strokeWidth={2.5} />
            </View>
            <AppText style={styles.kpiLabel}>{t('analytics.netAccumulated')}</AppText>
          </View>
          <AppText
            style={[
              styles.kpiValue,
              { color: netOverall >= 0 ? theme.colors.accent : theme.colors.danger },
            ]}
            tabularNums
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
    paddingBottom: 110,
    gap: theme.spacing.lg,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: theme.spacing.xxs,
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
    gap: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    gap: theme.spacing.xs,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  kpiIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.3,
  },
});
