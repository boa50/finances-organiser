import { CategoryAggregate, MonthlyAggregate, Transaction } from '../types';
import { convertCurrency, DEFAULT_CURRENCY } from './currencies';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  totalNetBalance: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthNet: number;
}

export interface GroupedRecentItem {
  id: string;
  representativeTx: Transaction;
  type: 'income' | 'expense';
  title: string;
  totalAmount: number;
  currencyId: string;
  categoryId?: string;
  paymentMethodId?: string;
  bankId?: string;
  store?: string;
  installments?: number;
  date: string;
}

export interface TransactionFilterOptions {
  type?: 'income' | 'expense' | 'all';
  category?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Calculates overall and current-month financial totals (income, expense, net balance)
 * converted to a target currency (default: BRL).
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  targetCurrency: string = DEFAULT_CURRENCY,
  referenceDate: Date = new Date()
): FinancialSummary {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  let totalIncome = 0;
  let totalExpense = 0;
  let currentMonthIncome = 0;
  let currentMonthExpense = 0;

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currencyId, targetCurrency);
    const txDate = new Date(tx.date);
    const isCurrentMonth =
      !isNaN(txDate.getTime()) &&
      txDate.getFullYear() === currentYear &&
      txDate.getMonth() === currentMonth;

    if (tx.type === 'income') {
      totalIncome += val;
      if (isCurrentMonth) {
        currentMonthIncome += val;
      }
    } else {
      totalExpense += val;
      if (isCurrentMonth) {
        currentMonthExpense += val;
      }
    }
  });

  return {
    totalIncome,
    totalExpense,
    totalNetBalance: totalIncome - totalExpense,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthNet: currentMonthIncome - currentMonthExpense,
  };
}

/**
 * Groups installment transactions into a single representative item and combines
 * standalone items into a sorted list of recent transactions.
 */
export function parseInstallmentTitle(title: string): string {
  return title.replace(/\s*\(\d+\/\d+\)$/, '').trim();
}

export function groupRecentTransactions(
  allTx: Transaction[],
  limit: number = 4
): GroupedRecentItem[] {
  const groupsMap = new Map<string, Transaction[]>();
  const standaloneItems: Transaction[] = [];

  allTx.forEach((tx) => {
    if (tx.type === 'expense' && tx.installments && tx.installments > 1) {
      const groupKey = tx.installmentGroupId
        ? tx.installmentGroupId
        : `${parseInstallmentTitle(tx.title).toLowerCase()}_${tx.installments}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey)!.push(tx);
    } else {
      standaloneItems.push(tx);
    }
  });

  const result: GroupedRecentItem[] = [];

  groupsMap.forEach((txList) => {
    txList.sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1));
    const firstInst = txList.find((t) => t.installmentNumber === 1) || txList[0];

    const baseTitle = parseInstallmentTitle(firstInst.title);
    const installments = firstInst.installments || txList.length;
    const totalAmount = txList.reduce((sum, t) => sum + t.amount, 0);

    result.push({
      id: firstInst.installmentGroupId || firstInst.id,
      representativeTx: firstInst,
      type: firstInst.type,
      title: baseTitle,
      totalAmount: totalAmount > 0 ? totalAmount : firstInst.amount * installments,
      currencyId: firstInst.currencyId,
      categoryId: firstInst.categoryId,
      paymentMethodId: firstInst.paymentMethodId,
      bankId: firstInst.bankId,
      store: firstInst.store,
      installments,
      date: firstInst.date,
    });
  });

  standaloneItems.forEach((tx) => {
    result.push({
      id: tx.id,
      representativeTx: tx,
      type: tx.type,
      title: tx.title,
      totalAmount: tx.amount,
      currencyId: tx.currencyId,
      categoryId: tx.categoryId,
      paymentMethodId: tx.paymentMethodId,
      bankId: tx.bankId,
      store: tx.store,
      installments: tx.installments,
      date: tx.date,
    });
  });

  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return result.slice(0, limit);
}

/**
 * Groups transactions by YYYY-MM and computes monthly income, expense, and net values.
 */
export function aggregateTransactionsByMonth(
  transactions: Transaction[],
  targetCurrency: string = DEFAULT_CURRENCY
): MonthlyAggregate[] {
  const monthMap: { [key: string]: { income: number; expense: number; date: Date } } = {};

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return;

    const year = txDate.getFullYear();
    const month = String(txDate.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    if (!monthMap[key]) {
      monthMap[key] = {
        income: 0,
        expense: 0,
        date: new Date(year, txDate.getMonth(), 1),
      };
    }

    const convertedAmount = convertCurrency(tx.amount, tx.currencyId, targetCurrency);

    if (tx.type === 'income') {
      monthMap[key].income += convertedAmount;
    } else {
      monthMap[key].expense += convertedAmount;
    }
  });

  const sortedKeys = Object.keys(monthMap).sort();
  return sortedKeys.map((key) => {
    const item = monthMap[key];
    const monthName = item.date.toLocaleString('default', { month: 'short' });
    const yearShort = item.date.getFullYear().toString().slice(-2);
    return {
      monthKey: key,
      monthLabel: `${monthName} '${yearShort}`,
      income: item.income,
      expense: item.expense,
      net: item.income - item.expense,
      date: item.date,
    };
  });
}

/**
 * Aggregates transactions by category for a specific transaction type ('income' or 'expense').
 */
export function aggregateTransactionsByCategory(
  transactions: Transaction[],
  targetType: 'income' | 'expense',
  categoryColorMap: Record<string, string> = {},
  targetCurrency: string = DEFAULT_CURRENCY
): CategoryAggregate[] {
  const categoryTotals: Record<string, number> = {};
  let totalForType = 0;

  transactions.forEach((tx) => {
    if (tx.type !== targetType) return;
    const amount = convertCurrency(tx.amount, tx.currencyId, targetCurrency);
    const cat = tx.categoryId || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    totalForType += amount;
  });

  if (totalForType === 0) return [];

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalForType) * 100,
      color: categoryColorMap[category] || '#64748B',
      type: targetType,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Filters transactions based on type, category, search query, and date boundaries.
 */
export function filterTransactions(
  transactions: Transaction[],
  options: TransactionFilterOptions = {}
): Transaction[] {
  const { type = 'all', category, searchQuery, startDate, endDate } = options;

  return transactions.filter((tx) => {
    if (type !== 'all' && tx.type !== type) return false;
    if (category && (tx.categoryId || '').toLowerCase() !== category.toLowerCase()) return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const titleMatch = tx.title.toLowerCase().includes(q);
      const categoryMatch = tx.categoryId ? tx.categoryId.toLowerCase().includes(q) : false;
      const storeMatch = tx.store ? tx.store.toLowerCase().includes(q) : false;
      const notesMatch = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
      if (!titleMatch && !categoryMatch && !storeMatch && !notesMatch) return false;
    }

    if (startDate && new Date(tx.date).getTime() < new Date(startDate).getTime()) return false;
    if (endDate && new Date(tx.date).getTime() > new Date(endDate).getTime()) return false;

    return true;
  });
}
