import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Transaction } from '../types';
import { D3EvolutionChart } from '../components/D3EvolutionChart';
import { D3CurrentMonthCharts } from '../components/D3CurrentMonthCharts';
import { CURRENCIES, DEFAULT_CURRENCY, convertCurrency, formatMoney } from '../utils/currencies';
import theme from '../theme';

interface AnalyticsScreenProps {
  transactions: Transaction[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ transactions }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);

  // Compute total statistics across all recorded transactions
  let totalIncomeConverted = 0;
  let totalExpenseConverted = 0;

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currency, selectedCurrency);
    if (tx.type === 'income') {
      totalIncomeConverted += val;
    } else {
      totalExpenseConverted += val;
    }
  });

  const netOverall = totalIncomeConverted - totalExpenseConverted;
  const overallSavingsRate =
    totalIncomeConverted > 0 ? ((totalIncomeConverted - totalExpenseConverted) / totalIncomeConverted) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Financial Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Interactive D3.js evolution & monthly breakdown charts
          </Text>
        </View>

        {/* Currency Filter */}
        <View style={styles.currencyFilterContainer}>
          <Text style={styles.filterLabel}>Display Currency:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm }}
          >
            {CURRENCIES.slice(0, 5).map((c) => {
              const selected = selectedCurrency === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.currencyChip,
                    selected && styles.currencyChipActive,
                  ]}
                  onPress={() => setSelectedCurrency(c.code)}
                >
                  <Text style={styles.currencyFlag}>{c.flag}</Text>
                  <Text
                    style={[
                      styles.currencyText,
                      selected && styles.currencyTextActive,
                    ]}
                  >
                    {c.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Lifetime Incomes</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.success }]}>
            +{formatMoney(totalIncomeConverted, selectedCurrency)}
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Lifetime Expenses</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.danger }]}>
            -{formatMoney(totalExpenseConverted, selectedCurrency)}
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Net Accumulated</Text>
          <Text
            style={[
              styles.kpiValue,
              { color: netOverall >= 0 ? theme.colors.accent : theme.colors.danger },
            ]}
          >
            {formatMoney(netOverall, selectedCurrency)}
          </Text>
        </View>
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
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xxs,
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
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  currencyChipActive: {
    backgroundColor: theme.colors.accentBgStrong,
    borderColor: theme.colors.accent,
  },
  currencyFlag: {
    fontSize: 12,
  },
  currencyText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  currencyTextActive: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: theme.spacing.base,
    marginVertical: theme.spacing.xs,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  kpiLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
  },
});
