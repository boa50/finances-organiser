import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryAggregate } from '../../types';
import { formatMoney } from '../../utils/currencies';
import { AppCard, AppText } from '../ui';
import theme, { useTheme } from '../../theme';

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
  const { theme } = useTheme();

  return (
    <AppCard variant="glass" padding="4xl" style={styles.card}>
      <AppText style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
        {t('analytics.expenseCategories', { month: monthName })}
      </AppText>
      <AppText style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
        {t('analytics.expenseCategoriesSubtitle')}
      </AppText>

      {categoryAggregates.length === 0 ? (
        <AppText style={[styles.emptyCatText, { color: theme.colors.textTertiary }]}>
          {t('analytics.noExpensesForMonth')}
        </AppText>
      ) : (
        <View style={styles.categoryList}>
          {categoryAggregates.map((cat, index) => (
            <View key={`cat-${index}`} style={styles.catItem}>
              <View style={styles.catHeader}>
                <View style={styles.catNameRow}>
                  <View style={[styles.catColorDot, { backgroundColor: cat.color || theme.colors.accent }]} />
                  <AppText style={[styles.catName, { color: theme.colors.textPrimary }]}>
                    {cat.category}
                  </AppText>
                </View>
                <View style={styles.catAmountRow}>
                  <AppText style={[styles.catAmount, { color: theme.colors.textPrimary }]} tabularNums>
                    {formatMoney(cat.amount, targetCurrency)}
                  </AppText>
                  <View
                    style={[
                      styles.percentPill,
                      {
                        backgroundColor: theme.colors.surfaceRecessed,
                        borderColor: theme.colors.borderSubtle,
                      },
                    ]}
                  >
                    <AppText style={[styles.catPercent, { color: theme.colors.textSecondary }]} tabularNums>
                      {cat.percentage.toFixed(1)}%
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceRecessed }]}>
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
    </AppCard>
  );
};

export const D3CategoryBarChart = CategorySpendingBarChart;
export type D3CategoryBarChartProps = CategorySpendingBarChartProps;

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xl,
  },
  emptyCatText: {
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
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  catAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  catAmount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  percentPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  catPercent: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
