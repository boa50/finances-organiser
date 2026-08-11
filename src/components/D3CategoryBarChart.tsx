import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryAggregate } from '../types';
import { formatMoney } from '../utils/currencies';
import { AppText } from './ui';
import theme from '../theme';

interface D3CategoryBarChartProps {
  categoryAggregates: CategoryAggregate[];
  monthName: string;
  targetCurrency: string;
}

export const D3CategoryBarChart: React.FC<D3CategoryBarChartProps> = ({
  categoryAggregates,
  monthName,
  targetCurrency,
}) => {
  return (
    <View style={styles.card}>
      <AppText style={styles.cardTitle}>Expense Categories ({monthName})</AppText>
      <AppText style={styles.cardSubtitle}>D3 scaling for category distribution</AppText>

      {categoryAggregates.length === 0 ? (
        <AppText style={styles.emptyCatText}>No expense transactions found for this month.</AppText>
      ) : (
        <View style={styles.categoryList}>
          {categoryAggregates.map((cat, index) => (
            <View key={`cat-${index}`} style={styles.catItem}>
              <View style={styles.catHeader}>
                <AppText style={styles.catName}>{cat.category}</AppText>
                <AppText style={styles.catAmount}>
                  {formatMoney(cat.amount, targetCurrency)}{' '}
                  <AppText style={styles.catPercent}>({cat.percentage.toFixed(1)}%)</AppText>
                </AppText>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: cat.color,
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
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing['2xl'],
  },
  emptyCatText: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.base,
    fontStyle: 'italic',
    marginVertical: theme.spacing.base,
  },
  categoryList: {
    gap: theme.spacing.xl,
  },
  catItem: {
    gap: theme.spacing.sm,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  catAmount: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  catPercent: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
  },
  barTrack: {
    height: 8,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.spacing.xs,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.spacing.xs,
  },
});
