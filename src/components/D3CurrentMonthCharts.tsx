import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as d3 from 'd3';
import { Transaction, CategoryAggregate } from '../types';
import { convertCurrency, formatMoney, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/currencies';

interface D3CurrentMonthChartsProps {
  transactions: Transaction[];
  targetCurrency: string;
  selectedMonthDate?: Date; // Defaults to current month
}

export const D3CurrentMonthCharts: React.FC<D3CurrentMonthChartsProps> = ({
  transactions,
  targetCurrency,
  selectedMonthDate = new Date(),
}) => {
  const currentYear = selectedMonthDate.getFullYear();
  const currentMonth = selectedMonthDate.getMonth();

  // Filter transactions for current month
  const monthTransactions = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthName = selectedMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenseMap: { [cat: string]: number } = {};
  const categoryIncomeMap: { [cat: string]: number } = {};

  monthTransactions.forEach((tx) => {
    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency);
    if (tx.type === 'income') {
      totalIncome += converted;
      categoryIncomeMap[tx.category] = (categoryIncomeMap[tx.category] || 0) + converted;
    } else {
      totalExpense += converted;
      categoryExpenseMap[tx.category] = (categoryExpenseMap[tx.category] || 0) + converted;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const totalFlow = totalIncome + totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Prepare D3 Donut Data
  const pieData = [
    { label: 'Income', value: totalIncome, color: '#10B981' },
    { label: 'Expense', value: totalExpense, color: '#F43F5E' },
  ];

  // Donut chart D3 calculations
  const donutSize = 220;
  const radius = donutSize / 2;
  const innerRadius = radius * 0.62;

  const pieGenerator = d3
    .pie<{ label: string; value: number; color: string }>()
    .value((d) => (d.value > 0 ? d.value : 0.001))
    .sort(null);

  const arcGenerator = d3
    .arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(radius - 10)
    .cornerRadius(6)
    .padAngle(0.04);

  const arcs = pieGenerator(pieData);

  // Category breakdown data
  const categoryAggregates: CategoryAggregate[] = Object.keys(categoryExpenseMap)
    .map((catName) => {
      const amount = categoryExpenseMap[catName];
      const categoryObj = EXPENSE_CATEGORIES.find((c) => c.name === catName);
      return {
        category: catName,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: categoryObj?.color || '#3B82F6',
        type: 'expense' as const,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Category Bar Chart D3 setup
  const barChartWidth = Math.min(Dimensions.get('window').width - 80, 600);
  const barHeight = 32;
  const maxCategoryAmount = d3.max(categoryAggregates, (d) => d.amount) || 1;

  const barScale = d3
    .scaleLinear()
    .domain([0, maxCategoryAmount])
    .range([0, barChartWidth - 140]);

  return (
    <View style={styles.container}>
      {/* Current Month Overview Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current Month Breakdown ({monthName})</Text>
        <Text style={styles.sectionSubtitle}>Income vs Expense ratio & Category analytics</Text>
      </View>

      {/* Grid Layout: Donut Chart + Savings Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Incomes vs Expenses Ratio</Text>
        <View style={styles.donutRow}>
          {/* D3 Donut SVG */}
          <View style={styles.donutWrapper}>
            <Svg width={donutSize} height={donutSize}>
              <G transform={`translate(${radius}, ${radius})`}>
                {arcs.map((arc, i) => {
                  const pathData = arcGenerator(arc) || '';
                  return <Path key={`arc-${i}`} d={pathData} fill={pieData[i].color} />;
                })}
              </G>
            </Svg>

            {/* Inner Donut Center Content */}
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterLabel}>Net Balance</Text>
              <Text
                style={[
                  styles.donutCenterValue,
                  { color: netBalance >= 0 ? '#10B981' : '#F43F5E' },
                ]}
              >
                {formatMoney(netBalance, targetCurrency)}
              </Text>

              <View
                style={[
                  styles.savingsBadge,
                  { backgroundColor: savingsRate >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.savingsBadgeText,
                    { color: savingsRate >= 0 ? '#10B981' : '#F43F5E' },
                  ]}
                >
                  {savingsRate >= 0 ? `+${savingsRate.toFixed(0)}% saved` : `${savingsRate.toFixed(0)}% deficit`}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats List next to Donut */}
          <View style={styles.statsColumn}>
            <View style={styles.statBox}>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  +{formatMoney(totalIncome, targetCurrency)}
                </Text>
              </View>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                <View style={[styles.statDot, { backgroundColor: '#F43F5E' }]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Expense</Text>
                <Text style={[styles.statValue, { color: '#F43F5E' }]}>
                  -{formatMoney(totalExpense, targetCurrency)}
                </Text>
              </View>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <View style={[styles.statDot, { backgroundColor: '#38BDF8' }]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Cashflow</Text>
                <Text style={[styles.statValue, { color: '#38BDF8' }]}>
                  {formatMoney(totalFlow, targetCurrency)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* D3 Category Bar Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expense Categories ({monthName})</Text>
        <Text style={styles.cardSubtitle}>D3 scaling for category distribution</Text>

        {categoryAggregates.length === 0 ? (
          <Text style={styles.emptyCatText}>No expense transactions found for this month.</Text>
        ) : (
          <View style={styles.categoryList}>
            {categoryAggregates.map((cat, index) => {
              const barW = Math.max(barScale(cat.amount), 8);
              return (
                <View key={`cat-${index}`} style={styles.catItem}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{cat.category}</Text>
                    <Text style={styles.catAmount}>
                      {formatMoney(cat.amount, targetCurrency)}{' '}
                      <Text style={styles.catPercent}>({cat.percentage.toFixed(1)}%)</Text>
                    </Text>
                  </View>

                  {/* D3 Scale Bar */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: cat.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 12,
  },
  donutWrapper: {
    position: 'relative',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  donutCenterValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 2,
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsColumn: {
    flex: 1,
    minWidth: 200,
    gap: 12,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  emptyCatText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    marginVertical: 10,
  },
  categoryList: {
    gap: 14,
  },
  catItem: {
    gap: 6,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  catAmount: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  catPercent: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '400',
  },
  barTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
