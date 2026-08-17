import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react-native';
import { AppCard, AppText } from '../ui';
import { formatMoney } from '../../utils/currencies';
import theme from '../../theme';

export interface NetBalanceHeroCardProps {
  netBalance: number;
  income: number;
  expense: number;
  currency: string;
  monthName: string;
  sparklineData?: number[];
}

export const NetBalanceHeroCard: React.FC<NetBalanceHeroCardProps> = ({
  netBalance,
  income,
  expense,
  currency,
  monthName,
}) => {
  const { t } = useTranslation();
  const [isPrivacyMasked, setIsPrivacyMasked] = useState(false);

  const displayBalance = isPrivacyMasked ? '••••••' : formatMoney(netBalance, currency);
  const displayIncome = isPrivacyMasked ? '••••' : `+${formatMoney(income, currency)}`;
  const displayExpense = isPrivacyMasked ? '••••' : `-${formatMoney(expense, currency)}`;

  // Deterministic lightweight sparkline path based on netBalance direction
  const isPositive = netBalance >= 0;
  const strokeColor = isPositive ? theme.colors.success : theme.colors.danger;

  return (
    <AppCard variant="hero" padding="5xl" style={styles.card}>
      {/* Top Header Row with Label & Privacy Toggle */}
      <View style={styles.topHeader}>
        <View style={styles.labelGroup}>
          <AppText style={styles.heroLabel}>
            {t('overview.netBalance60Days', { currency })}
          </AppText>
        </View>

        <Pressable
          style={({ pressed }) => [styles.privacyBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setIsPrivacyMasked((prev) => !prev)}
          accessibilityLabel={isPrivacyMasked ? 'Show balance' : 'Hide balance'}
        >
          {isPrivacyMasked ? (
            <EyeOff size={16} color={theme.colors.textSecondary} />
          ) : (
            <Eye size={16} color={theme.colors.textSecondary} />
          )}
        </Pressable>
      </View>

      {/* Hero Value Row with Background Sparkline Wave */}
      <View style={styles.valueRow}>
        <View style={styles.valueContainer}>
          <AppText style={styles.heroValue} tabularNums>
            {displayBalance}
          </AppText>
        </View>

        {/* Decorative Mini Sparkline Wave */}
        <View style={styles.sparklineContainer}>
          <Svg width={110} height={42} viewBox="0 0 110 42">
            <Defs>
              <LinearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>
            <Path
              d={
                isPositive
                  ? 'M0,32 Q25,28 50,18 T105,6 L105,42 L0,42 Z'
                  : 'M0,8 Q25,14 50,22 T105,36 L105,42 L0,42 Z'
              }
              fill="url(#heroSparkGrad)"
            />
            <Path
              d={
                isPositive
                  ? 'M0,32 Q25,28 50,18 T105,6'
                  : 'M0,8 Q25,14 50,22 T105,36'
              }
              fill="none"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>

      {/* Income & Expense Split Boxes */}
      <View style={styles.heroMetaRow}>
        <View style={styles.metaBox}>
          <View style={styles.metaIconHeader}>
            <View style={styles.incomeIconBadge}>
              <TrendingUp size={12} color={theme.colors.success} strokeWidth={2.5} />
            </View>
            <AppText style={styles.metaLabel}>{t('overview.income', { month: monthName })}</AppText>
          </View>
          <AppText style={[styles.metaValue, { color: theme.colors.success }]} tabularNums>
            {displayIncome}
          </AppText>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaIconHeader}>
            <View style={styles.expenseIconBadge}>
              <TrendingDown size={12} color={theme.colors.danger} strokeWidth={2.5} />
            </View>
            <AppText style={styles.metaLabel}>{t('overview.expense', { month: monthName })}</AppText>
          </View>
          <AppText style={[styles.metaValue, { color: theme.colors.danger }]} tabularNums>
            {displayExpense}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radii.card,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelGroup: {
    flex: 1,
  },
  heroLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  privacyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceRecessed,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.md,
  },
  valueContainer: {
    flex: 1,
  },
  heroValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.8,
  },
  sparklineContainer: {
    width: 110,
    height: 42,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  metaBox: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.base,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceRecessed,
    borderColor: theme.colors.borderSubtle,
  },
  metaIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xxs,
  },
  incomeIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  metaValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },
});
