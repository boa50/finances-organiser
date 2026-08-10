import { Transaction } from '../../types';
import {
  aggregateTransactionsByCategory,
  aggregateTransactionsByMonth,
  calculateFinancialSummary,
  filterTransactions,
  groupRecentTransactions,
} from '../financials';

describe('Financial Utilities', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      title: 'Salary',
      amount: 5000,
      currency: 'BRL',
      category: 'Salary / Wages',
      date: '2026-08-01T10:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      title: 'Rent',
      amount: 1500,
      currency: 'BRL',
      category: 'Housing',
      date: '2026-08-05T10:00:00.000Z',
      createdAt: '2026-08-05T10:00:00.000Z',
    },
    {
      id: 'tx-3',
      type: 'expense',
      title: 'Groceries',
      amount: 500,
      currency: 'BRL',
      category: 'Groceries / Food',
      date: '2026-08-10T10:00:00.000Z',
      createdAt: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'tx-4',
      type: 'expense',
      title: 'Laptop (1/3)',
      amount: 1000,
      currency: 'BRL',
      category: 'Shopping',
      installments: 3,
      installmentNumber: 1,
      installmentGroupId: 'laptop_group',
      date: '2026-07-01T10:00:00.000Z',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: 'tx-5',
      type: 'expense',
      title: 'Laptop (2/3)',
      amount: 1000,
      currency: 'BRL',
      category: 'Shopping',
      installments: 3,
      installmentNumber: 2,
      installmentGroupId: 'laptop_group',
      date: '2026-08-01T10:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ];

  describe('calculateFinancialSummary', () => {
    it('should calculate total income, total expense, and net balance correctly', () => {
      const refDate = new Date('2026-08-15T00:00:00.000Z');
      const summary = calculateFinancialSummary(sampleTransactions, 'BRL', refDate);

      expect(summary.totalIncome).toBe(5000);
      expect(summary.totalExpense).toBe(4000); // 1500 + 500 + 1000 + 1000
      expect(summary.totalNetBalance).toBe(1000);
      expect(summary.currentMonthIncome).toBe(5000);
      expect(summary.currentMonthExpense).toBe(3000); // 1500 + 500 + 1000
      expect(summary.currentMonthNet).toBe(2000);
    });

    it('should return zeros for an empty array of transactions', () => {
      const summary = calculateFinancialSummary([], 'BRL');
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.totalNetBalance).toBe(0);
      expect(summary.currentMonthIncome).toBe(0);
      expect(summary.currentMonthExpense).toBe(0);
    });
  });

  describe('groupRecentTransactions', () => {
    it('should group installment transactions together into a single item', () => {
      const recent = groupRecentTransactions(sampleTransactions, 10);
      const laptopGroup = recent.find((item) => item.id === 'laptop_group');

      expect(laptopGroup).toBeDefined();
      expect(laptopGroup?.installments).toBe(3);
      expect(laptopGroup?.totalAmount).toBe(2000); // 1000 + 1000
      expect(laptopGroup?.title).toBe('Laptop');
    });

    it('should respect the limit parameter', () => {
      const recent = groupRecentTransactions(sampleTransactions, 2);
      expect(recent.length).toBeLessThanOrEqual(2);
    });
  });

  describe('aggregateTransactionsByMonth', () => {
    it('should aggregate transactions by month chronologically', () => {
      const monthly = aggregateTransactionsByMonth(sampleTransactions, 'BRL');

      expect(monthly.length).toBe(2); // 2026-07 and 2026-08
      expect(monthly[0].monthKey).toBe('2026-07');
      expect(monthly[0].expense).toBe(1000);
      expect(monthly[1].monthKey).toBe('2026-08');
      expect(monthly[1].income).toBe(5000);
      expect(monthly[1].expense).toBe(3000);
      expect(monthly[1].net).toBe(2000);
    });
  });

  describe('aggregateTransactionsByCategory', () => {
    it('should group expense amounts by category and compute percentages', () => {
      const categoryColorMap = {
        Housing: '#F97316',
        'Groceries / Food': '#EF4444',
        Shopping: '#EC4899',
      };

      const categories = aggregateTransactionsByCategory(
        sampleTransactions,
        'expense',
        categoryColorMap,
        'BRL'
      );

      expect(categories.length).toBe(3); // Housing, Shopping, Groceries
      const housing = categories.find((c) => c.category === 'Housing');
      expect(housing).toBeDefined();
      expect(housing?.amount).toBe(1500);
      expect(housing?.color).toBe('#F97316');
      expect(housing?.percentage).toBeCloseTo(37.5); // 1500 / 4000 * 100
    });

    it('should return empty array if no transactions match the type', () => {
      const categories = aggregateTransactionsByCategory([], 'income');
      expect(categories).toEqual([]);
    });
  });

  describe('filterTransactions', () => {
    it('should filter transactions by type', () => {
      const incomeOnly = filterTransactions(sampleTransactions, { type: 'income' });
      expect(incomeOnly.length).toBe(1);
      expect(incomeOnly[0].title).toBe('Salary');
    });

    it('should filter transactions by search query', () => {
      const searchResult = filterTransactions(sampleTransactions, { searchQuery: 'Rent' });
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].title).toBe('Rent');
    });

    it('should return all transactions when filter options are default', () => {
      const filtered = filterTransactions(sampleTransactions);
      expect(filtered.length).toBe(sampleTransactions.length);
    });
  });
});
