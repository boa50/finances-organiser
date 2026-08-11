import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryAggregate, Transaction } from '../types';
import { convertCurrency, EXPENSE_CATEGORIES } from '../utils/currencies';
import { AppText } from './ui';
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
    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency);
    if (tx.type === 'income') {
      totalIncome += converted;
    } else {
      totalExpense += converted;
      categoryExpenseMap[tx.category] = (categoryExpenseMap[tx.category] || 0) + converted;
    }
  });

  const categoryAggregates: CategoryAggregate[] = Object.keys(categoryExpenseMap)
    .map((catName) => {
      const amount = categoryExpenseMap[catName];
      const categoryObj = EXPENSE_CATEGORIES.find((c) => c.name === catName);
      return {
        category: catName,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: categoryObj?.color || '#3B82F6',
        type: 'expense' as const,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>Current Month Breakdown ({monthName})</AppText>
        <AppText style={styles.sectionSubtitle}>Income vs Expense ratio & Category analytics</AppText>
      </View>

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
  },
  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    marginTop: theme.spacing.xxs,
  },
});
