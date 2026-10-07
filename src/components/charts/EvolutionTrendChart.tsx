import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable, ScrollView } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { Transaction, MonthlyAggregate, CategoryItem } from '../../types';
import { aggregateEvolutionData } from '../../utils/financials';
import { categoryService } from '../../services/categoryService';
import { useEvolutionChartD3 } from '../../hooks/useEvolutionChartD3';
import { MonthDetailSummaryCard } from '../analytics/MonthDetailSummaryCard';
import {
  AppCard,
  AppMultiSelectDropdown,
  AppSegmentedControl,
  AppText,
  MultiSelectItem,
} from '../ui';
import theme, { useTheme } from '../../theme';

export type EvolutionPeriod = '5y' | '1y' | '6m';

export interface EvolutionTrendChartProps {
  transactions: Transaction[];
  targetCurrency: string;
  categories?: CategoryItem[];
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
  categories,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<EvolutionPeriod>('1y');
  const [selectedMonth, setSelectedMonth] = useState<MonthlyAggregate | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const availableCategories = useMemo(() => {
    return categories || categoryService.getCategoriesSync();
  }, [categories]);

  const categoryFilterItems = useMemo<MultiSelectItem[]>(() => {
    return availableCategories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
    }));
  }, [availableCategories]);

  const hasIncomeSelected = useMemo(() => {
    if (selectedCategoryIds.length === 0) return true;
    return availableCategories.some(
      (c) => selectedCategoryIds.includes(c.id) && c.type === 'income'
    );
  }, [selectedCategoryIds, availableCategories]);

  const hasExpenseSelected = useMemo(() => {
    if (selectedCategoryIds.length === 0) return true;
    return availableCategories.some(
      (c) => selectedCategoryIds.includes(c.id) && c.type === 'expense'
    );
  }, [selectedCategoryIds, availableCategories]);

  const filteredTransactions = useMemo(() => {
    if (selectedCategoryIds.length === 0) return transactions;
    const selectedSet = new Set(selectedCategoryIds);
    return transactions.filter(
      (tx) => tx.categoryId && selectedSet.has(tx.categoryId)
    );
  }, [transactions, selectedCategoryIds]);

  const periodOptions: { label: string; value: EvolutionPeriod }[] = [
    { label: t('analytics.period5y'), value: '5y' },
    { label: t('analytics.period1y'), value: '1y' },
    { label: t('analytics.period6m'), value: '6m' },
  ];

  const limitMonths = selectedPeriod === '6m' ? 6 : selectedPeriod === '1y' ? 12 : 60;

  const monthlyData = useMemo(() => {
    return aggregateEvolutionData(filteredTransactions, targetCurrency, limitMonths);
  }, [filteredTransactions, targetCurrency, limitMonths]);

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
    includeIncome: hasIncomeSelected,
    includeExpense: hasExpenseSelected,
  });

  const activeMonth =
    selectedMonth && monthlyData.some((d) => d.monthKey === selectedMonth.monthKey)
      ? selectedMonth
      : monthlyData[monthlyData.length - 1];

  // Calculate X-axis label density to prevent overlapping
  const maxVisibleTicks = Math.max(2, Math.floor(innerWidth / 65));
  const stride = Math.max(1, Math.ceil(monthlyData.length / maxVisibleTicks));

  return (
    <AppCard variant="glass" padding="4xl" style={styles.card}>
      {/* Top Header Row with Title on Left and Controls on Right */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <AppText style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
            {t('analytics.evolutionTitle')}
          </AppText>
          <AppText style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
            {t('analytics.evolutionSubtitle')}
          </AppText>
        </View>

        <View style={styles.headerControls}>
          <AppMultiSelectDropdown
            items={categoryFilterItems}
            selectedIds={selectedCategoryIds}
            onChange={(ids) => {
              setSelectedCategoryIds(ids);
              setSelectedMonth(null);
            }}
            showTypeFilter
          />
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

      {/* Active Category Filter Chips Row */}
      {selectedCategoryIds.length > 0 && (
        <View style={styles.activeFilterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFilterChipsContainer}
          >
            {selectedCategoryIds.map((catId) => {
              const cat = availableCategories.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <View
                  key={`active-cat-${catId}`}
                  style={[
                    styles.activeChip,
                    {
                      backgroundColor: theme.colors.surfaceRecessed,
                      borderColor: cat.color ? `${cat.color}60` : theme.colors.borderSubtle,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.activeChipDot,
                      { backgroundColor: cat.color || theme.colors.accent },
                    ]}
                  />
                  <AppText style={[styles.activeChipText, { color: theme.colors.textPrimary }]}>
                    {cat.name}
                  </AppText>
                  <Pressable
                    onPress={() => {
                      setSelectedCategoryIds((prev) => prev.filter((id) => id !== catId));
                      setSelectedMonth(null);
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={({ pressed }) => [styles.chipRemoveBtn, pressed && { opacity: 0.6 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove filter ${cat.name}`}
                  >
                    <X size={12} color={theme.colors.textMuted} />
                  </Pressable>
                </View>
              );
            })}
            <Pressable
              onPress={() => {
                setSelectedCategoryIds([]);
                setSelectedMonth(null);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.clearAllBtn}
            >
              <AppText style={[styles.clearAllBtnText, { color: theme.colors.accent }]}>
                {t('common.clear')}
              </AppText>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Compact Legend Row */}
      <View style={styles.legendContainer}>
        {hasIncomeSelected && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <AppText style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {t('common.income')}
            </AppText>
          </View>
        )}
        {hasExpenseSelected && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
            <AppText style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {t('common.expense')}
            </AppText>
          </View>
        )}
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
            {hasIncomeSelected && incomeAreaPath ? (
              <Path d={incomeAreaPath} fill="url(#incomeGradient)" />
            ) : null}
            {hasExpenseSelected && expenseAreaPath ? (
              <Path d={expenseAreaPath} fill="url(#expenseGradient)" />
            ) : null}

            {/* Income & Expense Lines with Glowing Stroke */}
            {hasIncomeSelected && incomePath ? (
              <Path
                d={incomePath}
                fill="none"
                stroke={theme.colors.success}
                strokeOpacity={0.9}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ) : null}
            {hasExpenseSelected && expensePath ? (
              <Path
                d={expensePath}
                fill="none"
                stroke={theme.colors.danger}
                strokeOpacity={0.9}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ) : null}

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
                      stroke={theme.colors.borderAccent}
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                  )}

                  {hasIncomeSelected && isSelected && (
                    <Circle
                      cx={cx}
                      cy={cyIncome}
                      r={10}
                      fill={theme.colors.success}
                      fillOpacity={0.2}
                    />
                  )}
                  {hasExpenseSelected && isSelected && (
                    <Circle
                      cx={cx}
                      cy={cyExpense}
                      r={10}
                      fill={theme.colors.danger}
                      fillOpacity={0.2}
                    />
                  )}

                  {/* Node circles */}
                  {hasIncomeSelected && (
                    <Circle
                      cx={cx}
                      cy={cyIncome}
                      r={isSelected ? 6 : 4}
                      fill={theme.colors.success}
                      stroke={theme.colors.surface}
                      strokeWidth={2}
                    />
                  )}
                  {hasExpenseSelected && (
                    <Circle
                      cx={cx}
                      cy={cyExpense}
                      r={isSelected ? 6 : 4}
                      fill={theme.colors.danger}
                      stroke={theme.colors.surface}
                      strokeWidth={2}
                    />
                  )}

                  {/* X Axis Label */}
                  {shouldShowLabel && (
                    <SvgText
                      x={cx}
                      y={innerHeight + 20}
                      fill={isSelected ? theme.colors.accent : theme.colors.textSecondary}
                      fontSize={theme.fontSize.xs}
                      fontFamily={theme.fontFamily.sans}
                      fontWeight={isSelected ? theme.fontWeight.bold : theme.fontWeight.regular}
                      textAnchor="middle"
                    >
                      {d.monthLabel}
                    </SvgText>
                  )}

                  {/* Touch Target for tapping month */}
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
        <MonthDetailSummaryCard
          activeMonth={activeMonth}
          targetCurrency={targetCurrency}
          showIncome={hasIncomeSelected}
          showExpense={hasExpenseSelected}
        />
      )}
    </AppCard>
  );
};

export const D3EvolutionChart = EvolutionTrendChart;
export type D3EvolutionChartProps = EvolutionTrendChartProps;

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.xs,
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
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  activeFilterRow: {
    marginBottom: theme.spacing.xs,
  },
  activeFilterChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  activeChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  chipRemoveBtn: {
    padding: theme.spacing.xxs,
  },
  clearAllBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  clearAllBtnText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
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
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xxs,
  },
});
