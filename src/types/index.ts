export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: string; // e.g. 'USD', 'EUR', 'BRL', 'GBP'
  category: string;
  paymentMethod?: string;
  bank?: string;
  store?: string;
  date: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss.sssZ
  notes?: string;
  createdAt: string;
}

export interface TursoConfig {
  url: string;
  authToken: string;
  isConnected: boolean;
  isEnvConfigured?: boolean;
  lastSyncedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault?: boolean;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface BankItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface MonthlyAggregate {
  monthKey: string; // e.g. '2026-03'
  monthLabel: string; // e.g. 'Mar 2026'
  income: number;
  expense: number;
  net: number;
  date: Date;
}

export interface CategoryAggregate {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  type: TransactionType;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}
