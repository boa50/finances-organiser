import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Transaction } from '../types';
import { D3CurrentMonthCharts } from '../components/D3CurrentMonthCharts';
import { D3EvolutionChart } from '../components/D3EvolutionChart';
import { DEFAULT_CURRENCY, convertCurrency, formatMoney } from '../utils/currencies';
import { AppCard, AppText } from '../components/ui';
import theme from '../theme';

interface AnalyticsScreenProps {
  transactions: Transaction[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ transactions }) => {
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
        <AppText style={styles.pageTitle}>Financial Analytics</AppText>
        <AppText style={styles.pageSubtitle}>
          Interactive D3.js evolution & monthly breakdown charts
        </AppText>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <AppCard style={styles.kpiCard} padding="xl">
          <Text style={styles.kpiLabel}>Lifetime Incomes</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.success }]}>
            +{formatMoney(totalIncomeConverted, DEFAULT_CURRENCY)}
          </Text>
        </AppCard>

        <AppCard style={styles.kpiCard} padding="xl">
          <Text style={styles.kpiLabel}>Lifetime Expenses</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.danger }]}>
            -{formatMoney(totalExpenseConverted, DEFAULT_CURRENCY)}
          </Text>
        </AppCard>

        <AppCard style={styles.kpiCard} padding="xl">
          <Text style={styles.kpiLabel}>Net Accumulated</Text>
          <Text
            style={[
              styles.kpiValue,
              { color: netOverall >= 0 ? theme.colors.accent : theme.colors.danger },
            ]}
          >
            {formatMoney(netOverall, DEFAULT_CURRENCY)}
          </Text>
        </AppCard>
      </View>

      {/* Graph 1: D3 Current Month Incomes & Expenses Breakdown */}
      <D3CurrentMonthCharts transactions={transactions} targetCurrency={DEFAULT_CURRENCY} />

      {/* Graph 2: D3 Evolution by Month */}
      <D3EvolutionChart transactions={transactions} targetCurrency={DEFAULT_CURRENCY} />
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

