import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MonthlyAggregate } from '../../types';
import { formatMoney } from '../../utils/currencies';
import { AppText } from '../ui';
import theme from '../../theme';

export interface MonthDetailSummaryCardProps {
  activeMonth: MonthlyAggregate;
  targetCurrency: string;
}

export const MonthDetailSummaryCard: React.FC<MonthDetailSummaryCardProps> = ({
  activeMonth,
  targetCurrency,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.monthDetailCard}>
      <AppText style={styles.detailTitle}>
        {t('analytics.monthSummaryTitle', { month: activeMonth.monthLabel })}
      </AppText>
      <View style={styles.detailRow}>
        <View style={styles.detailMetric}>
          <AppText style={styles.detailLabel}>{t('common.income')}</AppText>
          <AppText style={[styles.detailValue, { color: theme.colors.success }]}>
            +{formatMoney(activeMonth.income, targetCurrency)}
          </AppText>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailMetric}>
          <AppText style={styles.detailLabel}>{t('common.expense')}</AppText>
          <AppText style={[styles.detailValue, { color: theme.colors.danger }]}>
            -{formatMoney(activeMonth.expense, targetCurrency)}
          </AppText>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailMetric}>
          <AppText style={styles.detailLabel}>{t('analytics.netBalance')}</AppText>
          <AppText
            style={[
              styles.detailValue,
              { color: activeMonth.net >= 0 ? theme.colors.accent : theme.colors.danger },
            ]}
          >
            {formatMoney(activeMonth.net, targetCurrency)}
          </AppText>
        </View>
      </View>
    </View>
  );
};

export const SelectedMonthDetailCard = MonthDetailSummaryCard;
export type SelectedMonthDetailCardProps = MonthDetailSummaryCardProps;

const styles = StyleSheet.create({
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
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
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
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.xxs,
  },
  detailValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});
