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
            contentContainerStyle={{ gap: 6 }}
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
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            +{formatMoney(totalIncomeConverted, selectedCurrency)}
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Lifetime Expenses</Text>
          <Text style={[styles.kpiValue, { color: '#F43F5E' }]}>
            -{formatMoney(totalExpenseConverted, selectedCurrency)}
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Net Accumulated</Text>
          <Text
            style={[
              styles.kpiValue,
              { color: netOverall >= 0 ? '#38BDF8' : '#F43F5E' },
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
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    padding: 20,
    gap: 12,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    marginBottom: 8,
    gap: 12,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  currencyFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  filterLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  currencyChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  currencyFlag: {
    fontSize: 12,
  },
  currencyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  currencyTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
  },
});
