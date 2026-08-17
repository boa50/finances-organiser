import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryAggregate } from '../../types';
import { formatMoney } from '../../utils/currencies';
import { AppText } from '../ui';
import theme from '../../theme';

export interface CategorySpendingBarChartProps {
  categoryAggregates: CategoryAggregate[];
  monthName: string;
  targetCurrency: string;
}

export const CategorySpendingBarChart: React.FC<CategorySpendingBarChartProps> = ({
  categoryAggregates,
  monthName,
  targetCurrency,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <AppText style={styles.cardTitle}>{t('analytics.expenseCategories', { month: monthName })}</AppText>
      <AppText style={styles.cardSubtitle}>{t('analytics.expenseCategoriesSubtitle')}</AppText>

      {categoryAggregates.length === 0 ? (
        <AppText style={styles.emptyCatText}>{t('analytics.noExpensesForMonth')}</AppText>
      ) : (
        <View style={styles.categoryList}>
          {categoryAggregates.map((cat, index) => (
            <View key={`cat-${index}`} style={styles.catItem}>
              <View style={styles.catHeader}>
                <View style={styles.catNameRow}>
                  <View style={[styles.catColorDot, { backgroundColor: cat.color || theme.colors.accent }]} />
                  <AppText style={styles.catName}>{cat.category}</AppText>
                </View>
                <View style={styles.catAmountRow}>
                  <AppText style={styles.catAmount} tabularNums>
                    {formatMoney(cat.amount, targetCurrency)}
                  </AppText>
                  <View style={styles.percentPill}>
                    <AppText style={styles.catPercent} tabularNums>
                      {cat.percentage.toFixed(1)}%
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: cat.color || theme.colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const D3CategoryBarChart = CategorySpendingBarChart;
export type D3CategoryBarChartProps = CategorySpendingBarChartProps;

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
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xl,
  },
  emptyCatText: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.sm,
    fontStyle: 'italic',
    marginVertical: theme.spacing.base,
  },
  categoryList: {
    gap: theme.spacing.lg,
  },
  catItem: {
    gap: theme.spacing.xs,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  catAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  catAmount: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  percentPill: {
    backgroundColor: theme.colors.surfaceRecessed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  catPercent: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  barTrack: {
    height: 6,
    backgroundColor: theme.colors.surfaceRecessed,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
