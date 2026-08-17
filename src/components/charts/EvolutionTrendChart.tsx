import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Transaction, MonthlyAggregate } from '../../types';
import { aggregateEvolutionData } from '../../utils/financials';
import { useEvolutionChartD3 } from '../../hooks/useEvolutionChartD3';
import { MonthDetailSummaryCard } from '../analytics/MonthDetailSummaryCard';
import { AppSegmentedControl, AppText } from '../ui';
import theme from '../../theme';

export type EvolutionPeriod = '5y' | '1y' | '6m';

export interface EvolutionTrendChartProps {
  transactions: Transaction[];
  targetCurrency: string;
}

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

export const EvolutionTrendChart: React.FC<EvolutionTrendChartProps> = ({
  transactions,
  targetCurrency,
}) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<EvolutionPeriod>('1y');
  const [selectedMonth, setSelectedMonth] = useState<MonthlyAggregate | null>(null);

  const periodOptions: { label: string; value: EvolutionPeriod }[] = [
    { label: t('analytics.period5y'), value: '5y' },
    { label: t('analytics.period1y'), value: '1y' },
    { label: t('analytics.period6m'), value: '6m' },
  ];

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
          <AppText style={styles.cardTitle}>{t('analytics.evolutionTitle')}</AppText>
          <AppText style={styles.cardSubtitle}>{t('analytics.evolutionSubtitle')}</AppText>
        </View>

        <View style={styles.headerControls}>
          <AppSegmentedControl<EvolutionPeriod>
            options={periodOptions}
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
          <AppText style={styles.legendText}>{t('common.income')}</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
          <AppText style={styles.legendText}>{t('common.expense')}</AppText>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.success} stopOpacity="0.32" />
              <Stop offset="50%" stopColor={theme.colors.success} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={theme.colors.success} stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.danger} stopOpacity="0.32" />
              <Stop offset="50%" stopColor={theme.colors.danger} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={theme.colors.danger} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          <G transform={`translate(${marginLeft}, ${marginTop})`}>
            {/* Subtle horizontal grid lines */}
            {yTicks.map((tick, i) => {
              const yPos = yScale(tick);
              return (
                <G key={`y-axis-tick-${i}`}>
                  <Line
                    x1={0}
                    y1={yPos}
                    x2={innerWidth}
                    y2={yPos}
                    stroke={theme.colors.borderSubtle}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <SvgText
                    x={-10}
                    y={yPos + 4}
                    fill={theme.colors.textTertiary}
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

            {/* Income & Expense Lines with Glowing Stroke */}
            <Path
              d={incomePath}
              fill="none"
              stroke={theme.colors.success}
              strokeOpacity={0.9}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d={expensePath}
              fill="none"
              stroke={theme.colors.danger}
              strokeOpacity={0.9}
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
                      stroke="rgba(56, 189, 248, 0.4)"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                  )}

                  {isSelected && (
                    <Circle
                      cx={cx}
                      cy={cyIncome}
                      r={10}
                      fill={theme.colors.success}
                      fillOpacity={0.2}
                    />
                  )}
                  <Circle
                    cx={cx}
                    cy={cyIncome}
                    r={isSelected ? 5 : 3.5}
                    fill={theme.colors.success}
                    fillOpacity={1}
                    stroke={theme.colors.surfaceElevated}
                    strokeWidth={2}
                  />

                  {isSelected && (
                    <Circle
                      cx={cx}
                      cy={cyExpense}
                      r={10}
                      fill={theme.colors.danger}
                      fillOpacity={0.2}
                    />
                  )}
                  <Circle
                    cx={cx}
                    cy={cyExpense}
                    r={isSelected ? 5 : 3.5}
                    fill={theme.colors.danger}
                    fillOpacity={1}
                    stroke={theme.colors.surfaceElevated}
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
        <MonthDetailSummaryCard activeMonth={activeMonth} targetCurrency={targetCurrency} />
      )}
    </View>
  );
};

export const D3EvolutionChart = EvolutionTrendChart;
export type D3EvolutionChartProps = EvolutionTrendChartProps;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceGlass,
    borderRadius: theme.radii.card,
    padding: theme.spacing['4xl'],
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
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
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xxs,
  },
});
