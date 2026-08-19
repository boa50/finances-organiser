import { CategoryAggregate, CategoryItem, MonthlyAggregate, Transaction } from '../types';
import { convertCurrency, DEFAULT_CURRENCY } from './currencies';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  totalNetBalance: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthNet: number;
  last60DaysIncome: number;
  last60DaysExpense: number;
  last60DaysNetBalance: number;
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
  categories?: CategoryItem[];
}

/**
 * Safely parses a transaction date (string YYYY-MM-DD... or Date) into a local Date object
 * at 00:00:00.000 local time, preventing UTC offset shifts.
 */
export function parseTransactionDate(dateInput: Date | string | undefined | null): Date {
  if (!dateInput) return new Date(NaN);
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return new Date(NaN);
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }
  const str = String(dateInput).trim();
  if (!str) return new Date(NaN);
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10); // 1-12
    const rawDay = parseInt(match[3], 10);
    if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const validDay = Math.min(Math.max(rawDay, 1), daysInMonth);
      return new Date(year, month - 1, validDay, 0, 0, 0, 0);
    }
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
  }
  return new Date(NaN);
}

/**
 * Formats a Date object as YYYY-MM-DD using local calendar date values.
 */
export function formatDateToYMD(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a transaction date string or Date object so that the time part
 * is set to the beginning of the day (00:00:00.000Z), preserving the date part.
 * Safely clamps invalid days (e.g. Feb 31 -> Feb 28/29) to the actual days in that month.
 */
export function normalizeTransactionDate(dateInput: Date | string): string {
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10); // 1-12
      const rawDay = parseInt(match[3], 10);
      if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const validDay = Math.min(Math.max(rawDay, 1), daysInMonth);
        const yStr = String(year);
        const mStr = String(month).padStart(2, '0');
        const dStr = String(validDay).padStart(2, '0');
        return `${yStr}-${mStr}-${dStr}T00:00:00.000Z`;
      }
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }
  } else if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Calculates the exact date for an installment item given the base purchase date
 * and the zero-based installment offset (0 for 1st installment, 1 for 2nd, etc.).
 *
 * Handles variable month lengths gracefully by clamping the target day to the
 * maximum available days in the target month (e.g. Jan 31 + 1 month -> Feb 28/29),
 * while preserving the original base day on subsequent months with 31 days (e.g. Mar 31).
 */
export function calculateInstallmentDate(
  baseDateInput: Date | string,
  installmentOffset: number
): Date {
  const base = parseTransactionDate(baseDateInput);
  if (Number.isNaN(base.getTime())) {
    return new Date();
  }

  const baseYear = base.getFullYear();
  const baseMonth = base.getMonth();
  const baseDay = base.getDate();

  const totalMonths = baseMonth + installmentOffset;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(Math.max(baseDay, 1), daysInTargetMonth);

  return new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
}

/**
 * Calculates overall, current-month, and last 60 days financial totals (income, expense, net balance)
 * converted to a target currency (default: BRL).
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  targetCurrency: string = DEFAULT_CURRENCY,
  referenceDate: Date = new Date()
): FinancialSummary {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const endOfRefDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    23,
    59,
    59,
    999
  );

  const startOf60DaysWindow = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  );
  startOf60DaysWindow.setDate(startOf60DaysWindow.getDate() - 60);

  let totalIncome = 0;
  let totalExpense = 0;
  let currentMonthIncome = 0;
  let currentMonthExpense = 0;
  let last60DaysIncome = 0;
  let last60DaysExpense = 0;

  transactions.forEach((tx) => {
    const val = convertCurrency(tx.amount, tx.currencyId, targetCurrency);
    const txDate = parseTransactionDate(tx.date);
    const isValidDate = !isNaN(txDate.getTime());

    const isCurrentMonth =
      isValidDate &&
      txDate.getFullYear() === currentYear &&
      txDate.getMonth() === currentMonth;

    const isLast60Days =
      isValidDate &&
      txDate.getTime() >= startOf60DaysWindow.getTime() &&
      txDate.getTime() <= endOfRefDay.getTime();

    if (tx.type === 'income') {
      totalIncome += val;
      if (isCurrentMonth) {
        currentMonthIncome += val;
      }
      if (isLast60Days) {
        last60DaysIncome += val;
      }
    } else {
      totalExpense += val;
      if (isCurrentMonth) {
        currentMonthExpense += val;
      }
      if (isLast60Days) {
        last60DaysExpense += val;
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
    last60DaysIncome,
    last60DaysExpense,
    last60DaysNetBalance: last60DaysIncome - last60DaysExpense,
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

  result.sort((a, b) => parseTransactionDate(b.date).getTime() - parseTransactionDate(a.date).getTime());
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
    const txDate = parseTransactionDate(tx.date);
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
 * Groups transactions by month for a specified number of past months ending at referenceDate (default: current month).
 * Guaranteed to produce a continuous series ending at the current month.
 */
export function aggregateEvolutionData(
  transactions: Transaction[],
  targetCurrency: string = DEFAULT_CURRENCY,
  monthsCount: number = 12,
  referenceDate: Date = new Date()
): MonthlyAggregate[] {
  const monthMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((tx) => {
    const txDate = parseTransactionDate(tx.date);
    if (isNaN(txDate.getTime())) return;

    const year = txDate.getFullYear();
    const month = String(txDate.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    if (!monthMap[key]) {
      monthMap[key] = { income: 0, expense: 0 };
    }

    const convertedAmount = convertCurrency(tx.amount, tx.currencyId, targetCurrency);

    if (tx.type === 'income') {
      monthMap[key].income += convertedAmount;
    } else {
      monthMap[key].expense += convertedAmount;
    }
  });

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const result: MonthlyAggregate[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    const monthName = d.toLocaleString('default', { month: 'short' });
    const yearShort = year.toString().slice(-2);
    const income = monthMap[key]?.income || 0;
    const expense = monthMap[key]?.expense || 0;

    result.push({
      monthKey: key,
      monthLabel: `${monthName} '${yearShort}`,
      income,
      expense,
      net: income - expense,
      date: d,
    });
  }

  return result;
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
  const { type = 'all', category, searchQuery, startDate, endDate, categories } = options;

  const startParsed = startDate ? parseTransactionDate(startDate).getTime() : null;
  const endParsed = endDate
    ? new Date(
        parseTransactionDate(endDate).getFullYear(),
        parseTransactionDate(endDate).getMonth(),
        parseTransactionDate(endDate).getDate(),
        23,
        59,
        59,
        999
      ).getTime()
    : null;

  return transactions.filter((tx) => {
    if (type !== 'all' && tx.type !== type) return false;
    if (category && (tx.categoryId || '').toLowerCase() !== category.toLowerCase()) return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const titleMatch = tx.title.toLowerCase().includes(q);
      const catObj = (tx.categoryId && categories)
        ? categories.find((c) => c.id === tx.categoryId || c.name.toLowerCase() === tx.categoryId?.toLowerCase())
        : null;
      const catName = catObj ? catObj.name : (tx.categoryId || '');
      const categoryMatch = catName ? catName.toLowerCase().includes(q) : false;
      const storeMatch = tx.store ? tx.store.toLowerCase().includes(q) : false;
      const notesMatch = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
      if (!titleMatch && !categoryMatch && !storeMatch && !notesMatch) return false;
    }

    if (startParsed !== null && parseTransactionDate(tx.date).getTime() < startParsed) return false;
    if (endParsed !== null && parseTransactionDate(tx.date).getTime() > endParsed) return false;

    return true;
  });
}
