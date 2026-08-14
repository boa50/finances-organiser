import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Transaction, MonthlyAggregate } from '../types';
import { aggregateEvolutionData } from '../utils/financials';
import { useEvolutionChartD3 } from '../hooks/useEvolutionChartD3';
import { SelectedMonthDetailCard } from './SelectedMonthDetailCard';
import { AppSegmentedControl, AppText } from './ui';
import theme from '../theme';

export type EvolutionPeriod = '5y' | '1y' | '6m';

interface D3EvolutionChartProps {
  transactions: Transaction[];
  targetCurrency: string;
}

const PERIOD_OPTIONS: { label: string; value: EvolutionPeriod }[] = [
  { label: '5 Years', value: '5y' },
  { label: '1 Year', value: '1y' },
  { label: '6 Months', value: '6m' },
];

function formatYAxisTick(tick: number): string {
  if (tick === 0) return '0';
  if (Math.abs(tick) >= 1_000_000) {
    const val = tick / 1_000_000;
    return val % 1 === 0 ? `${val.toFixed(0)}M` : `${val.toFixed(1)}M`;
  }
  if (Math.abs(tick) >= 1_000) {
    const val = tick / 1_000;
    return val % 1 === 0 ? `${val.toFixed(0)}k` : `${val.toFixed(1)}k`;
  }
  return tick % 1 === 0 ? tick.toFixed(0) : tick.toFixed(1);
}

export const D3EvolutionChart: React.FC<D3EvolutionChartProps> = ({
  transactions,
  targetCurrency,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<EvolutionPeriod>('1y');
  const [selectedMonth, setSelectedMonth] = useState<MonthlyAggregate | null>(null);

  const limitMonths = selectedPeriod === '6m' ? 6 : selectedPeriod === '1y' ? 12 : 60;

  const monthlyData = useMemo(() => {
    return aggregateEvolutionData(transactions, targetCurrency, limitMonths);
  }, [transactions, targetCurrency, limitMonths]);

  const width = Math.min(Dimensions.get('window').width - 48, 680);
  const height = 250;
  const marginTop = 16;
  const marginRight = 16;
  const marginBottom = 36;
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

  const activeMonth =
    selectedMonth && monthlyData.some((d) => d.monthKey === selectedMonth.monthKey)
      ? selectedMonth
      : monthlyData[monthlyData.length - 1];

  // Calculate X-axis label density to prevent overlapping
  const maxVisibleTicks = Math.max(2, Math.floor(innerWidth / 65));
  const stride = Math.max(1, Math.ceil(monthlyData.length / maxVisibleTicks));

  return (
    <View style={styles.card}>
      {/* Top Header Row with Title on Left and Period Selection on Right */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <AppText style={styles.cardTitle}>Income vs Expense Evolution</AppText>
          <AppText style={styles.cardSubtitle}>Monthly trend built with D3.js</AppText>
        </View>

        <View style={styles.headerControls}>
          <AppSegmentedControl<EvolutionPeriod>
            options={PERIOD_OPTIONS}
            selectedValue={selectedPeriod}
            onSelect={(period) => {
              setSelectedPeriod(period);
              setSelectedMonth(null);
            }}
            fullWidth={false}
            size="sm"
          />
        </View>
      </View>

      {/* Compact Legend Row */}
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

      <View style={styles.chartWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.success} stopOpacity="0.22" />
              <Stop offset="100%" stopColor={theme.colors.success} stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.danger} stopOpacity="0.22" />
              <Stop offset="100%" stopColor={theme.colors.danger} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          <G transform={`translate(${marginLeft}, ${marginTop})`}>
            {/* Y Axis Labels (Inner horizontal grid lines removed) */}
            {yTicks.map((tick, i) => {
              const yPos = yScale(tick);
              return (
                <G key={`y-axis-tick-${i}`}>
                  <SvgText
                    x={-10}
                    y={yPos + 4}
                    fill={theme.colors.textSecondary}
                    fontSize={theme.fontSize.xs}
                    fontFamily={theme.fontFamily.sans}
                    textAnchor="end"
                  >
                    {formatYAxisTick(tick)}
                  </SvgText>
                </G>
              );
            })}

            {/* Gradient Area Fills */}
            <Path d={incomeAreaPath} fill="url(#incomeGradient)" />
            <Path d={expenseAreaPath} fill="url(#expenseGradient)" />

            {/* Income & Expense Lines with Sophisticated Opacity */}
            <Path
              d={incomePath}
              fill="none"
              stroke={theme.colors.success}
              strokeOpacity={0.82}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d={expensePath}
              fill="none"
              stroke={theme.colors.danger}
              strokeOpacity={0.82}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Month Data Nodes & Dynamic Non-overlapping X Axis Labels */}
            {monthlyData.map((d, index) => {
              const cx = xScale(d.monthKey) || 0;
              const cyIncome = yScale(d.income);
              const cyExpense = yScale(d.expense);
              const isSelected = activeMonth?.monthKey === d.monthKey;

              const shouldShowLabel =
                monthlyData.length <= maxVisibleTicks ||
                index === 0 ||
                index === monthlyData.length - 1 ||
                (index % stride === 0 && index < monthlyData.length - Math.floor(stride / 2));

              return (
                <G key={`month-nodes-${d.monthKey}`}>
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
                    fillOpacity={0.9}
                    stroke="#0F172A"
                    strokeWidth={2}
                  />

                  <Circle
                    cx={cx}
                    cy={cyExpense}
                    r={isSelected ? 6 : 4}
                    fill={theme.colors.danger}
                    fillOpacity={0.9}
                    stroke="#0F172A"
                    strokeWidth={2}
                  />

                  {(shouldShowLabel || isSelected) && (
                    <SvgText
                      x={cx}
                      y={innerHeight + 22}
                      fill={isSelected ? theme.colors.accent : theme.colors.textSecondary}
                      fontSize={theme.fontSize.xs}
                      fontWeight={isSelected ? theme.fontWeight.bold : theme.fontWeight.regular}
                      fontFamily={theme.fontFamily.sans}
                      textAnchor="middle"
                    >
                      {d.monthLabel}
                    </SvgText>
                  )}

                  <Rect
                    x={cx - 20}
                    y={0}
                    width={40}
                    height={innerHeight + 28}
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
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  titleCol: {
    flex: 1,
    minWidth: 180,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
  headerControls: {
    alignItems: 'flex-end',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xxs,
  },
});
