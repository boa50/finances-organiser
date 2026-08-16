import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppCard, AppText } from '../ui';
import { formatMoney } from '../../utils/currencies';
import theme from '../../theme';

export interface NetBalanceHeroCardProps {
  netBalance: number;
  income: number;
  expense: number;
  currency: string;
  monthName: string;
}

export const NetBalanceHeroCard: React.FC<NetBalanceHeroCardProps> = ({
  netBalance,
  income,
  expense,
  currency,
  monthName,
}) => {
  const { t } = useTranslation();

  return (
    <AppCard variant="elevated" padding="6xl">
      <AppText style={styles.heroLabel}>
        {t('overview.netBalance60Days', { currency })}
      </AppText>
      <AppText style={styles.heroValue}>
        {formatMoney(netBalance, currency)}
      </AppText>

      <View style={styles.heroMetaRow}>
        <View style={styles.metaBox}>
          <AppText style={styles.metaLabel}>{t('overview.income', { month: monthName })}</AppText>
          <AppText style={[styles.metaValue, { color: theme.colors.success }]}>
            +{formatMoney(income, currency)}
          </AppText>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaBox}>
          <AppText style={styles.metaLabel}>{t('overview.expense', { month: monthName })}</AppText>
          <AppText style={[styles.metaValue, { color: theme.colors.danger }]}>
            -{formatMoney(expense, currency)}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  heroLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.black,
    marginVertical: theme.spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metaBox: {
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing['2xl'],
  },
  metaLabel: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.sm,
  },
  metaValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.xxs,
  },
});
