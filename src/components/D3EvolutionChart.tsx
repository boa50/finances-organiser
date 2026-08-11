import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Transaction, MonthlyAggregate } from '../types';
import { aggregateTransactionsByMonth } from '../utils/financials';
import { useEvolutionChartD3 } from '../hooks/useEvolutionChartD3';
import { SelectedMonthDetailCard } from './SelectedMonthDetailCard';
import { AppText } from './ui';
import theme from '../theme';

interface D3EvolutionChartProps {
  transactions: Transaction[];
  targetCurrency: string;
}

export const D3EvolutionChart: React.FC<D3EvolutionChartProps> = ({
  transactions,
  targetCurrency,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthlyAggregate | null>(null);

  const monthlyData: MonthlyAggregate[] = aggregateTransactionsByMonth(transactions, targetCurrency);

  const width = Math.min(Dimensions.get('window').width - 48, 680);
  const height = 260;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 40;
  const marginLeft = 55;

  const {
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    incomePath,
    expensePath,
    incomeAreaPath,
    expenseAreaPath,
    yTicks,
  } = useEvolutionChartD3({
    monthlyData,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  if (monthlyData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyText}>No monthly data available to draw graph.</AppText>
      </View>
    );
  }

  const activeMonth = selectedMonth || monthlyData[monthlyData.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <AppText style={styles.cardTitle}>Income vs Expense Evolution</AppText>
          <AppText style={styles.cardSubtitle}>Monthly trend built with D3.js</AppText>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <AppText style={styles.legendText}>Income</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
            <AppText style={styles.legendText}>Expense</AppText>
          </View>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.success} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={theme.colors.success} stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.danger} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={theme.colors.danger} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          <G transform={`translate(${marginLeft}, ${marginTop})`}>
            {yTicks.map((tick, i) => {
              const yPos = yScale(tick);
              return (
                <G key={`grid-${i}`}>
                  <Line
                    x1={0}
                    y1={yPos}
                    x2={innerWidth}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeDasharray="4 4"
                  />
                  <SvgText
                    x={-10}
                    y={yPos + 4}
                    fill={theme.colors.textSecondary}
                    fontSize={theme.fontSize.xs}
                    fontFamily={theme.fontFamily.sans}
                    textAnchor="end"
                  >
                    {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                  </SvgText>
                </G>
              );
            })}

            <Path d={incomeAreaPath} fill="url(#incomeGradient)" />
            <Path d={expenseAreaPath} fill="url(#expenseGradient)" />

            <Path
              d={incomePath}
              fill="none"
              stroke={theme.colors.success}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d={expensePath}
              fill="none"
              stroke={theme.colors.danger}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {monthlyData.map((d, index) => {
              const cx = xScale(d.monthLabel) || 0;
              const cyIncome = yScale(d.income);
              const cyExpense = yScale(d.expense);
              const isSelected = activeMonth?.monthKey === d.monthKey;

              return (
                <G key={`month-nodes-${index}`}>
                  {isSelected && (
                    <Line
                      x1={cx}
                      y1={0}
                      x2={cx}
                      y2={innerHeight}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                  )}

                  <Circle
                    cx={cx}
                    cy={cyIncome}
                    r={isSelected ? 6 : 4}
                    fill={theme.colors.success}
                    stroke="#0F172A"
                    strokeWidth={2}
                  />

                  <Circle
                    cx={cx}
                    cy={cyExpense}
                    r={isSelected ? 6 : 4}
                    fill={theme.colors.danger}
                    stroke="#0F172A"
                    strokeWidth={2}
                  />

                  <SvgText
                    x={cx}
                    y={innerHeight + 24}
                    fill={isSelected ? theme.colors.accent : theme.colors.textSecondary}
                    fontSize={theme.fontSize.xs}
                    fontWeight={isSelected ? theme.fontWeight.bold : theme.fontWeight.regular}
                    fontFamily={theme.fontFamily.sans}
                    textAnchor="middle"
                  >
                    {d.monthLabel}
                  </SvgText>

                  <Rect
                    x={cx - 20}
                    y={0}
                    width={40}
                    height={innerHeight + 30}
                    fill="transparent"
                    onPress={() => setSelectedMonth(d)}
                  />
                </G>
              );
            })}
          </G>
        </Svg>
      </View>

      {activeMonth && (
        <SelectedMonthDetailCard activeMonth={activeMonth} targetCurrency={targetCurrency} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing['4xl'],
    marginVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyContainer: {
    padding: 30,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    flexWrap: 'wrap',
    gap: theme.spacing.base,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xxs,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['2xl'],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xs,
  },
});
