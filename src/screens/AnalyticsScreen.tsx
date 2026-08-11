import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Transaction } from '../types';
import { D3EvolutionChart } from '../components/D3EvolutionChart';
import { D3CurrentMonthCharts } from '../components/D3CurrentMonthCharts';
import { DEFAULT_CURRENCY, convertCurrency, formatMoney } from '../utils/currencies';
import { currencyService } from '../services/currencyService';
import { AppBadge, AppCard, AppSectionHeader } from '../components/ui';
import theme from '../theme';

interface AnalyticsScreenProps {
  transactions: Transaction[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ transactions }) => {
  const enabledCurrencies = currencyService.getCurrenciesSync();
  const [selectedCurrency, setSelectedCurrency] = useState(
    enabledCurrencies.length > 0 ? enabledCurrencies[0].code : DEFAULT_CURRENCY
  );

  // Compute total statistics across all recorded transactions
  let totalIncomeConverted = 0;
  let totalExpenseConverted = 0;

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currencyId, selectedCurrency);
    if (tx.type === 'income') {
      totalIncomeConverted += val;
    } else {
      totalExpenseConverted += val;
    }
  });

  const netOverall = totalIncomeConverted - totalExpenseConverted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppSectionHeader
          title="Financial Analytics"
          subtitle="Interactive D3.js evolution & monthly breakdown charts"
        />

        {/* Currency Filter */}
        <View style={styles.currencyFilterContainer}>
          <Text style={styles.filterLabel}>Display Currency:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm }}
          >
            {enabledCurrencies.map((c) => {
              const selected = selectedCurrency === c.code;
              return (
                <AppBadge
                  key={c.code}
                  label={c.code}
                  icon={<Text style={styles.currencyFlag}>{c.flag}</Text>}
                  variant={selected ? 'accent' : 'neutral'}
                  onPress={() => setSelectedCurrency(c.code)}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <AppCard style={styles.kpiCard} padding="xl">
          <Text style={styles.kpiLabel}>Lifetime Incomes</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.success }]}>
            +{formatMoney(totalIncomeConverted, selectedCurrency)}
          </Text>
        </AppCard>

        <AppCard style={styles.kpiCard} padding="xl">
          <Text style={styles.kpiLabel}>Lifetime Expenses</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.danger }]}>
            -{formatMoney(totalExpenseConverted, selectedCurrency)}
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
            {formatMoney(netOverall, selectedCurrency)}
          </Text>
        </AppCard>
      </View>

      {/* Graph 1: D3 Evolution by Month */}
      <D3EvolutionChart transactions={transactions} targetCurrency={selectedCurrency} />

      {/* Graph 2: D3 Current Month Incomes & Expenses Breakdown */}
      <D3CurrentMonthCharts transactions={transactions} targetCurrency={selectedCurrency} />
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
  headerRow: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  currencyFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.base,
    marginTop: theme.spacing.sm,
  },
  filterLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  currencyFlag: {
    fontSize: theme.fontSize.sm,
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
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  kpiValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
  },
});
