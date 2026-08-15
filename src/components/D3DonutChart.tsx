import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../utils/currencies';
import { AppText } from './ui';
import theme from '../theme';

interface D3DonutChartProps {
  totalIncome: number;
  totalExpense: number;
  targetCurrency: string;
}

export const D3DonutChart: React.FC<D3DonutChartProps> = ({
  totalIncome,
  totalExpense,
  targetCurrency,
}) => {
  const { t } = useTranslation();
  const netBalance = totalIncome - totalExpense;
  const totalFlow = totalIncome + totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const pieData = [
    { label: t('common.income'), value: totalIncome, color: theme.colors.success },
    { label: t('common.expense'), value: totalExpense, color: theme.colors.danger },
  ];

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

  return (
    <View style={styles.card}>
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
            >
              {formatMoney(netBalance, targetCurrency)}
            </AppText>

            <View
              style={[
                styles.savingsBadge,
                { backgroundColor: savingsRate >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' },
              ]}
            >
              <AppText
                style={[
                  styles.savingsBadgeText,
                  { color: savingsRate >= 0 ? theme.colors.success : theme.colors.danger },
                ]}
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
            <View style={[styles.statBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
            </View>
            <View style={styles.statInfo}>
              <AppText style={styles.statLabel}>{t('analytics.totalIncome')}</AppText>
              <AppText style={[styles.statValue, { color: theme.colors.success }]}>
                +{formatMoney(totalIncome, targetCurrency)}
              </AppText>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.danger }]} />
            </View>
            <View style={styles.statInfo}>
              <AppText style={styles.statLabel}>{t('analytics.totalExpense')}</AppText>
              <AppText style={[styles.statValue, { color: theme.colors.danger }]}>
                -{formatMoney(totalExpense, targetCurrency)}
              </AppText>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.accent }]} />
            </View>
            <View style={styles.statInfo}>
              <AppText style={styles.statLabel}>{t('analytics.totalCashflow')}</AppText>
              <AppText style={[styles.statValue, { color: theme.colors.accent }]}>
                {formatMoney(totalFlow, targetCurrency)}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing['4xl'],
    marginVertical: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  },
  savingsBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 3,
    borderRadius: theme.radii.lg,
    marginTop: theme.spacing.xs,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  statsColumn: {
    flex: 1,
    minWidth: 200,
    gap: theme.spacing.lg,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
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
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginTop: 1,
  },
});
