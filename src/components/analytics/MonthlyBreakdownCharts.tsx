import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryAggregate, Transaction } from '../../types';
import { convertCurrency } from '../../utils/currencies';
import { parseTransactionDate } from '../../utils/financials';
import { categoryService } from '../../services/categoryService';
import { AppSectionHeader } from '../ui';
import { IncomeExpenseDonutChart } from '../charts/IncomeExpenseDonutChart';
import { CategorySpendingBarChart } from '../charts/CategorySpendingBarChart';
import theme from '../../theme';

export interface MonthlyBreakdownChartsProps {
  transactions: Transaction[];
  targetCurrency: string;
  selectedMonthDate?: Date;
}

export const MonthlyBreakdownCharts: React.FC<MonthlyBreakdownChartsProps> = ({
  transactions,
  targetCurrency,
  selectedMonthDate = new Date(),
}) => {
  const { t, i18n } = useTranslation();
  const currentYear = selectedMonthDate.getFullYear();
  const currentMonth = selectedMonthDate.getMonth();

  const monthTransactions = transactions.filter((tx) => {
    const d = parseTransactionDate(tx.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthName = selectedMonthDate.toLocaleString(i18n.language || undefined, { month: 'long', year: 'numeric' });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenseMap: { [cat: string]: number } = {};

  monthTransactions.forEach((tx) => {
    const converted = convertCurrency(tx.amount, tx.currencyId, targetCurrency);
    if (tx.type === 'income') {
      totalIncome += converted;
    } else {
      totalExpense += converted;
      const catKey = tx.categoryId || t('common.uncategorized');
      categoryExpenseMap[catKey] = (categoryExpenseMap[catKey] || 0) + converted;
    }
  });

  const categoriesList = categoryService.getCategoriesSync();
  const categoryAggregates: CategoryAggregate[] = Object.keys(categoryExpenseMap)
    .map((catKey) => {
      const amount = categoryExpenseMap[catKey];
      const categoryObj = categoriesList.find((c) => c.id === catKey);
      const catDisplayName = categoryObj?.name || catKey;
      return {
        category: catDisplayName,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: categoryObj?.color || '#3B82F6',
        type: 'expense' as const,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <View style={styles.container}>
      <AppSectionHeader
        title={t('analytics.currentMonthBreakdown', { month: monthName })}
        subtitle={t('analytics.currentMonthSubtitle')}
        style={styles.sectionHeader}
      />

      <IncomeExpenseDonutChart
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        targetCurrency={targetCurrency}
      />

      <CategorySpendingBarChart
        categoryAggregates={categoryAggregates}
        monthName={monthName}
        targetCurrency={targetCurrency}
      />
    </View>
  );
};

export const D3CurrentMonthCharts = MonthlyBreakdownCharts;
export type D3CurrentMonthChartsProps = MonthlyBreakdownChartsProps;

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
  },
});
