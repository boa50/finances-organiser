import { Transaction } from '../../types';
import {
  aggregateEvolutionData,
  aggregateTransactionsByCategory,
  aggregateTransactionsByMonth,
  calculateFinancialSummary,
  calculateInstallmentDate,
  filterTransactions,
  formatDateToYMD,
  groupRecentTransactions,
  normalizeTransactionDate,
  parseInstallmentTitle,
  parseTransactionDate,
} from '../financials';

describe('Financial Utilities', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      title: 'Salary',
      amount: 5000,
      currencyId: 'BRL',
      categoryId: 'Salary / Wages',
      date: '2026-08-01T10:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      title: 'Rent',
      amount: 1500,
      currencyId: 'BRL',
      categoryId: 'Housing',
      date: '2026-08-05T10:00:00.000Z',
      createdAt: '2026-08-05T10:00:00.000Z',
    },
    {
      id: 'tx-3',
      type: 'expense',
      title: 'Groceries',
      amount: 500,
      currencyId: 'BRL',
      categoryId: 'Groceries / Food',
      date: '2026-08-10T10:00:00.000Z',
      createdAt: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'tx-4',
      type: 'expense',
      title: 'Laptop (1/3)',
      amount: 1000,
      currencyId: 'BRL',
      categoryId: 'Shopping',
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
      currencyId: 'BRL',
      categoryId: 'Shopping',
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
      expect(summary.last60DaysIncome).toBe(5000);
      expect(summary.last60DaysExpense).toBe(4000);
      expect(summary.last60DaysNetBalance).toBe(1000);
    });

    it('should exclude transactions older than 60 days from last60DaysNetBalance', () => {
      const refDate = new Date('2026-08-15T00:00:00.000Z');
      const transactionsWithOldTx: Transaction[] = [
        ...sampleTransactions,
        {
          id: 'tx-old',
          type: 'income',
          title: 'Old Bonus',
          amount: 10000,
          currencyId: 'BRL',
          categoryId: 'Bonus',
          date: '2026-05-01T10:00:00.000Z', // > 60 days before 2026-08-15
          createdAt: '2026-05-01T10:00:00.000Z',
        },
        {
          id: 'tx-old-expense',
          type: 'expense',
          title: 'Old Vacation',
          amount: 3000,
          currencyId: 'BRL',
          categoryId: 'Travel',
          date: '2026-04-15T10:00:00.000Z', // > 60 days before 2026-08-15
          createdAt: '2026-04-15T10:00:00.000Z',
        },
      ];

      const summary = calculateFinancialSummary(transactionsWithOldTx, 'BRL', refDate);

      // Lifetime includes the old transactions
      expect(summary.totalIncome).toBe(15000);
      expect(summary.totalExpense).toBe(7000);
      expect(summary.totalNetBalance).toBe(8000);

      // Last 60 days excludes the old transactions
      expect(summary.last60DaysIncome).toBe(5000);
      expect(summary.last60DaysExpense).toBe(4000);
      expect(summary.last60DaysNetBalance).toBe(1000);
    });

    it('should return zeros for an empty array of transactions', () => {
      const summary = calculateFinancialSummary([], 'BRL');
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.totalNetBalance).toBe(0);
      expect(summary.currentMonthIncome).toBe(0);
      expect(summary.currentMonthExpense).toBe(0);
      expect(summary.last60DaysIncome).toBe(0);
      expect(summary.last60DaysExpense).toBe(0);
      expect(summary.last60DaysNetBalance).toBe(0);
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

  describe('aggregateEvolutionData', () => {
    it('should produce a continuous monthly series ending at the current reference month', () => {
      const refDate = new Date(2026, 7, 15); // August 2026
      const monthly = aggregateEvolutionData(sampleTransactions, 'BRL', 6, refDate);

      expect(monthly.length).toBe(6);
      expect(monthly[monthly.length - 1].monthKey).toBe('2026-08'); // Last month is always August 2026
      expect(monthly[0].monthKey).toBe('2026-03'); // 6 months: Mar to Aug
      expect(monthly[5].income).toBe(5000);
      expect(monthly[5].expense).toBe(3000);
      expect(monthly[4].expense).toBe(1000); // 2026-07
      expect(monthly[0].income).toBe(0); // 2026-03 zero data filled
    });

    it('should support 12 months (1 year) period ending at current month', () => {
      const refDate = new Date(2026, 7, 15); // August 2026
      const monthly = aggregateEvolutionData(sampleTransactions, 'BRL', 12, refDate);

      expect(monthly.length).toBe(12);
      expect(monthly[monthly.length - 1].monthKey).toBe('2026-08');
      expect(monthly[0].monthKey).toBe('2025-09');
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

  describe('parseInstallmentTitle', () => {
    it('removes installment suffix from title', () => {
      expect(parseInstallmentTitle('Netflix (2/12)')).toBe('Netflix');
    });

    it('returns original title if no installment suffix', () => {
      expect(parseInstallmentTitle('Groceries')).toBe('Groceries');
    });

    it('handles titles with parentheses that are not installments', () => {
      expect(parseInstallmentTitle('Gift (birthday)')).toBe('Gift (birthday)');
    });
  });

  describe('normalizeTransactionDate', () => {
    it('normalizes string dates with non-zero time to beginning of day 00:00:00.000Z', () => {
      expect(normalizeTransactionDate('2026-08-12T15:45:00.000Z')).toBe('2026-08-12T00:00:00.000Z');
    });

    it('normalizes date-only string YYYY-MM-DD to beginning of day 00:00:00.000Z', () => {
      expect(normalizeTransactionDate('2026-08-12')).toBe('2026-08-12T00:00:00.000Z');
    });

    it('normalizes Date object to beginning of day 00:00:00.000Z', () => {
      const d = new Date(2026, 7, 12, 14, 30, 0); // Aug 12, 2026 14:30
      expect(normalizeTransactionDate(d)).toBe('2026-08-12T00:00:00.000Z');
    });

    it('safely clamps out-of-range day strings (e.g. Feb 31 -> Feb 28)', () => {
      expect(normalizeTransactionDate('2026-02-31')).toBe('2026-02-28T00:00:00.000Z');
    });

    it('safely clamps out-of-range day strings on leap year (e.g. Feb 31, 2028 -> Feb 29)', () => {
      expect(normalizeTransactionDate('2028-02-31')).toBe('2028-02-29T00:00:00.000Z');
    });

    it('safely clamps 31st on 30-day month (e.g. Apr 31 -> Apr 30)', () => {
      expect(normalizeTransactionDate('2026-04-31')).toBe('2026-04-30T00:00:00.000Z');
    });
  });

  describe('calculateInstallmentDate', () => {
    it('generates correct monthly installment sequence starting from Jan 31 without month skipping', () => {
      const baseDate = new Date(2026, 0, 31); // Jan 31, 2026

      const expectedDates = [
        { month: 0, day: 31, year: 2026 },  // Jan 31
        { month: 1, day: 28, year: 2026 },  // Feb 28 (clamped)
        { month: 2, day: 31, year: 2026 },  // Mar 31 (restored to 31)
        { month: 3, day: 30, year: 2026 },  // Apr 30 (clamped)
        { month: 4, day: 31, year: 2026 },  // May 31 (restored to 31)
        { month: 5, day: 30, year: 2026 },  // Jun 30 (clamped)
        { month: 6, day: 31, year: 2026 },  // Jul 31 (restored to 31)
        { month: 7, day: 31, year: 2026 },  // Aug 31
        { month: 8, day: 30, year: 2026 },  // Sep 30 (clamped)
        { month: 9, day: 31, year: 2026 },  // Oct 31 (restored to 31)
        { month: 10, day: 30, year: 2026 }, // Nov 30 (clamped)
        { month: 11, day: 31, year: 2026 }, // Dec 31
        { month: 0, day: 31, year: 2027 },  // Jan 31, 2027 (next year rollover)
      ];

      expectedDates.forEach((expected, offset) => {
        const d = calculateInstallmentDate(baseDate, offset);
        expect(d.getFullYear()).toBe(expected.year);
        expect(d.getMonth()).toBe(expected.month);
        expect(d.getDate()).toBe(expected.day);
      });
    });

    it('correctly handles leap years for Feb (e.g. Jan 31, 2028 -> Feb 29, 2028)', () => {
      const baseDate = new Date(2028, 0, 31); // Jan 31, 2028 (leap year)
      const febDate = calculateInstallmentDate(baseDate, 1);
      expect(febDate.getFullYear()).toBe(2028);
      expect(febDate.getMonth()).toBe(1);
      expect(febDate.getDate()).toBe(29);
    });

    it('handles negative offsets when reconstructing base date', () => {
      const march31 = new Date(2026, 2, 31); // Mar 31, 2026 (installment 3)
      const reconstructedBase = calculateInstallmentDate(march31, -2);
      expect(reconstructedBase.getFullYear()).toBe(2026);
      expect(reconstructedBase.getMonth()).toBe(0);
      expect(reconstructedBase.getDate()).toBe(31);
    });

    it('handles regular mid-month dates without changing day', () => {
      const baseDate = new Date(2026, 0, 15); // Jan 15, 2026
      const febDate = calculateInstallmentDate(baseDate, 1);
      expect(febDate.getMonth()).toBe(1);
      expect(febDate.getDate()).toBe(15);
    });

    it('works when baseDateInput is an ISO string without timezone day shift', () => {
      const baseIso = '2026-08-19T00:00:00.000Z';
      const nextMonth = calculateInstallmentDate(baseIso, 1);
      expect(nextMonth.getFullYear()).toBe(2026);
      expect(nextMonth.getMonth()).toBe(8); // September
      expect(nextMonth.getDate()).toBe(19);
    });
  });

  describe('parseTransactionDate', () => {
    it('correctly parses ISO date string without shifting to previous day in any timezone', () => {
      const parsed = parseTransactionDate('2026-08-19T00:00:00.000Z');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(7); // August (0-indexed)
      expect(parsed.getDate()).toBe(19);
    });

    it('correctly parses YYYY-MM-DD string', () => {
      const parsed = parseTransactionDate('2026-08-19');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(7);
      expect(parsed.getDate()).toBe(19);
    });

    it('correctly parses Date objects without mutation', () => {
      const d = new Date(2026, 7, 19, 14, 30, 0);
      const parsed = parseTransactionDate(d);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(7);
      expect(parsed.getDate()).toBe(19);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });

    it('safely clamps out-of-range days in string format', () => {
      const parsed = parseTransactionDate('2026-02-31');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(1); // Feb
      expect(parsed.getDate()).toBe(28);
    });

    it('handles null, undefined, or empty gracefully by returning invalid Date', () => {
      const parsedNull = parseTransactionDate(null);
      expect(parsedNull).toBeInstanceOf(Date);
      expect(Number.isNaN(parsedNull.getTime())).toBe(true);

      const parsedUndefined = parseTransactionDate(undefined);
      expect(parsedUndefined).toBeInstanceOf(Date);
      expect(Number.isNaN(parsedUndefined.getTime())).toBe(true);

      const parsedEmpty = parseTransactionDate('');
      expect(parsedEmpty).toBeInstanceOf(Date);
      expect(Number.isNaN(parsedEmpty.getTime())).toBe(true);

      const parsedInvalid = parseTransactionDate('invalid-date');
      expect(parsedInvalid).toBeInstanceOf(Date);
      expect(Number.isNaN(parsedInvalid.getTime())).toBe(true);
    });
  });

  describe('formatDateToYMD', () => {
    it('formats Date object to YYYY-MM-DD using local calendar date values', () => {
      const d = new Date(2026, 7, 19, 23, 59, 59);
      expect(formatDateToYMD(d)).toBe('2026-08-19');
    });

    it('correctly pads single-digit months and days', () => {
      const d = new Date(2026, 0, 5, 0, 0, 0);
      expect(formatDateToYMD(d)).toBe('2026-01-05');
    });
  });
});
