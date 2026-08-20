import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../utils/currencies';
import { AppCard, AppText } from '../ui';
import theme, { useTheme } from '../../theme';

export interface IncomeExpenseDonutChartProps {
  totalIncome: number;
  totalExpense: number;
  targetCurrency: string;
}

export const IncomeExpenseDonutChart: React.FC<IncomeExpenseDonutChartProps> = ({
  totalIncome,
  totalExpense,
  targetCurrency,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const netBalance = totalIncome - totalExpense;
  const totalFlow = totalIncome + totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const pieData = [
    { label: t('common.income'), value: totalIncome, color: theme.colors.success },
    { label: t('common.expense'), value: totalExpense, color: theme.colors.danger },
  ];

  const donutSize = 220;
  const radius = donutSize / 2;
  const innerRadius = radius * 0.64;

  const pieGenerator = d3
    .pie<{ label: string; value: number; color: string }>()
    .value((d) => (d.value > 0 ? d.value : 0.001))
    .sort(null);

  const arcGenerator = d3
    .arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(radius - 8)
    .cornerRadius(8)
    .padAngle(0.05);

  const arcs = pieGenerator(pieData);

  return (
    <AppCard variant="glass" padding="4xl" style={styles.card}>
      <AppText style={styles.cardTitle}>{t('analytics.incomeExpenseRatio')}</AppText>
      <AppText style={styles.cardSubtitle}>{t('analytics.incomeExpenseRatioSubtitle')}</AppText>
      <View style={styles.donutRow}>
        <View style={styles.donutWrapper}>
          <Svg width={donutSize} height={donutSize}>
            <G transform={`translate(${radius}, ${radius})`}>
              {arcs.map((arc, i) => {
                const pathData = arcGenerator(arc) || '';
                return <Path key={`arc-${i}`} d={pathData} fill={pieData[i].color} />;
              })}
            </G>
          </Svg>

          <View style={styles.donutCenter}>
            <AppText style={styles.donutCenterLabel}>{t('analytics.netBalance')}</AppText>
            <AppText
              style={[
                styles.donutCenterValue,
                { color: netBalance >= 0 ? theme.colors.success : theme.colors.danger },
              ]}
              tabularNums
            >
              {formatMoney(netBalance, targetCurrency)}
            </AppText>

            <View
              style={[
                styles.savingsBadge,
                { backgroundColor: savingsRate >= 0 ? theme.colors.successBg : theme.colors.dangerBg },
              ]}
            >
              <AppText
                style={[
                  styles.savingsBadgeText,
                  { color: savingsRate >= 0 ? theme.colors.success : theme.colors.danger },
                ]}
                tabularNums
              >
                {savingsRate >= 0
                  ? t('analytics.percentSaved', { percent: savingsRate.toFixed(0) })
                  : t('analytics.percentDeficit', { percent: savingsRate.toFixed(0) })}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.statsColumn}>
          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: theme.colors.successBg }]}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
            </View>
            <View style={styles.statInfo}>
              <AppText style={styles.statLabel}>{t('analytics.totalIncome')}</AppText>
              <AppText style={[styles.statValue, { color: theme.colors.success }]} tabularNums>
                +{formatMoney(totalIncome, targetCurrency)}
              </AppText>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: theme.colors.dangerBg }]}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.danger }]} />
            </View>
            <View style={styles.statInfo}>
              <AppText style={styles.statLabel}>{t('analytics.totalExpense')}</AppText>
              <AppText style={[styles.statValue, { color: theme.colors.danger }]} tabularNums>
                -{formatMoney(totalExpense, targetCurrency)}
              </AppText>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: theme.colors.accentBg }]}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.accent }]} />
            </View>
            <View style={styles.statInfo}>
              <AppText style={styles.statLabel}>{t('analytics.totalCashflow')}</AppText>
              <AppText style={[styles.statValue, { color: theme.colors.accent }]} tabularNums>
                {formatMoney(totalFlow, targetCurrency)}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </AppCard>
  );
};

export const D3DonutChart = IncomeExpenseDonutChart;
export type D3DonutChartProps = IncomeExpenseDonutChartProps;

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.xs,
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
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: theme.spacing['4xl'],
    marginTop: theme.spacing.lg,
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
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  donutCenterValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.extrabold,
    marginVertical: theme.spacing.xxs,
    letterSpacing: -0.4,
  },
  savingsBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    marginTop: theme.spacing.xs,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  statsColumn: {
    flex: 1,
    minWidth: 200,
    gap: theme.spacing.md,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRecessed,
    padding: theme.spacing.md,
    borderRadius: theme.radii.base,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  statBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginTop: 1,
  },
});
