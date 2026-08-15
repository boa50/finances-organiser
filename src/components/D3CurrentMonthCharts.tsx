import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryAggregate, Transaction } from '../types';
import { convertCurrency } from '../utils/currencies';
import { categoryService } from '../services/categoryService';
import { AppSectionHeader } from './ui';
import { D3DonutChart } from './D3DonutChart';
import { D3CategoryBarChart } from './D3CategoryBarChart';
import theme from '../theme';

interface D3CurrentMonthChartsProps {
  transactions: Transaction[];
  targetCurrency: string;
  selectedMonthDate?: Date;
}

export const D3CurrentMonthCharts: React.FC<D3CurrentMonthChartsProps> = ({
  transactions,
  targetCurrency,
  selectedMonthDate = new Date(),
}) => {
  const currentYear = selectedMonthDate.getFullYear();
  const currentMonth = selectedMonthDate.getMonth();

  const monthTransactions = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthName = selectedMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenseMap: { [cat: string]: number } = {};

  monthTransactions.forEach((tx) => {
    const converted = convertCurrency(tx.amount, tx.currencyId, targetCurrency);
    if (tx.type === 'income') {
      totalIncome += converted;
    } else {
      totalExpense += converted;
      const catKey = tx.categoryId || 'Uncategorized';
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
        title={`Current Month Breakdown (${monthName})`}
        subtitle="Income vs Expense ratio & Category analytics"
        style={styles.sectionHeader}
      />

      <D3DonutChart
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        targetCurrency={targetCurrency}
      />

      <D3CategoryBarChart
        categoryAggregates={categoryAggregates}
        monthName={monthName}
        targetCurrency={targetCurrency}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
  },
});

