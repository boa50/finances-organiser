import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as d3 from 'd3';
import { Transaction, MonthlyAggregate } from '../types';
import { convertCurrency, formatMoney } from '../utils/currencies';
import { aggregateTransactionsByMonth } from '../utils/financials';
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


  if (monthlyData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No monthly data available to draw graph.</Text>
      </View>
    );
  }

  // Dimensions for D3 SVG chart
  const width = Math.min(Dimensions.get('window').width - 48, 680);
  const height = 260;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 40;
  const marginLeft = 55;

  const innerWidth = width - marginLeft - marginRight;
  const innerHeight = height - marginTop - marginBottom;

  // D3 Scales
  const xScale = d3
    .scalePoint<string>()
    .domain(monthlyData.map((d) => d.monthLabel))
    .range([0, innerWidth])
    .padding(0.2);

  const maxVal = d3.max(monthlyData, (d) => Math.max(d.income, d.expense)) || 1000;
  const yScale = d3
    .scaleLinear()
    .domain([0, maxVal * 1.15])
    .nice()
    .range([innerHeight, 0]);

  // D3 Line Generators
  const incomeLineGenerator = d3
    .line<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y((d) => yScale(d.income))
    .curve(d3.curveMonotoneX);

  const expenseLineGenerator = d3
    .line<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y((d) => yScale(d.expense))
    .curve(d3.curveMonotoneX);

  // D3 Area Generators for background gradients
  const incomeAreaGenerator = d3
    .area<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y0(innerHeight)
    .y1((d) => yScale(d.income))
    .curve(d3.curveMonotoneX);

  const expenseAreaGenerator = d3
    .area<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y0(innerHeight)
    .y1((d) => yScale(d.expense))
    .curve(d3.curveMonotoneX);

  const incomePath = incomeLineGenerator(monthlyData) || '';
  const expensePath = expenseLineGenerator(monthlyData) || '';
  const incomeAreaPath = incomeAreaGenerator(monthlyData) || '';
  const expenseAreaPath = expenseAreaGenerator(monthlyData) || '';

  // Y-Axis ticks
  const yTicks = yScale.ticks(5);

  const activeMonth = selectedMonth || monthlyData[monthlyData.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Income vs Expense Evolution</Text>
          <Text style={styles.cardSubtitle}>Monthly trend built with D3.js</Text>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
      </View>

      {/* D3 SVG Canvas */}
      <View style={styles.chartWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F43F5E" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          <G transform={`translate(${marginLeft}, ${marginTop})`}>
            {/* Grid lines */}
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
                    fill="#94A3B8"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                  </SvgText>
                </G>
              );
            })}

            {/* Gradient Area Fills */}
            <Path d={incomeAreaPath} fill="url(#incomeGradient)" />
            <Path d={expenseAreaPath} fill="url(#expenseGradient)" />

            {/* Line Paths */}
            <Path
              d={incomePath}
              fill="none"
              stroke="#10B981"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d={expensePath}
              fill="none"
              stroke="#F43F5E"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Data Circles and Click Handlers */}
            {monthlyData.map((d, index) => {
              const cx = xScale(d.monthLabel) || 0;
              const cyIncome = yScale(d.income);
              const cyExpense = yScale(d.expense);
              const isSelected = activeMonth?.monthKey === d.monthKey;

              return (
                <G key={`month-nodes-${index}`}>
                  {/* Selection Indicator Vertical Line */}
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

                  {/* Income Circle */}
                  <Circle
                    cx={cx}
                    cy={cyIncome}
                    r={isSelected ? 6 : 4}
                    fill="#10B981"
                    stroke="#0F172A"
                    strokeWidth={2}
                  />

                  {/* Expense Circle */}
                  <Circle
                    cx={cx}
                    cy={cyExpense}
                    r={isSelected ? 6 : 4}
                    fill="#F43F5E"
                    stroke="#0F172A"
                    strokeWidth={2}
                  />

                  {/* X Axis Label */}
                  <SvgText
                    x={cx}
                    y={innerHeight + 24}
                    fill={isSelected ? '#38BDF8' : '#94A3B8'}
                    fontSize="11"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {d.monthLabel}
                  </SvgText>

                  {/* Invisible Tap Area */}
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

      {/* Selected Month Detail Card */}
      {activeMonth && (
        <View style={styles.monthDetailCard}>
          <Text style={styles.detailTitle}>{activeMonth.monthLabel} Summary</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailMetric}>
              <Text style={styles.detailLabel}>Income</Text>
              <Text style={[styles.detailValue, { color: '#10B981' }]}>
                +{formatMoney(activeMonth.income, targetCurrency)}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailMetric}>
              <Text style={styles.detailLabel}>Expense</Text>
              <Text style={[styles.detailValue, { color: '#F43F5E' }]}>
                -{formatMoney(activeMonth.expense, targetCurrency)}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailMetric}>
              <Text style={styles.detailLabel}>Net Balance</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: activeMonth.net >= 0 ? theme.colors.accent : theme.colors.danger },
                ]}
              >
                {formatMoney(activeMonth.net, targetCurrency)}
              </Text>
            </View>
          </View>
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyContainer: {
    padding: 30,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '500',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xs,
  },
  monthDetailCard: {
    marginTop: theme.spacing['2xl'],
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  detailTitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailMetric: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.borderLight,
  },
  detailLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    marginBottom: theme.spacing.xxs,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
