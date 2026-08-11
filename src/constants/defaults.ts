import { CategoryItem, PaymentMethodItem, BankItem } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/currencies';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  ...EXPENSE_CATEGORIES.map((c, i) => ({
    id: `cat-exp-${i}`,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: 'expense' as const,
    isDefault: true,
  })),
  ...INCOME_CATEGORIES.map((c, i) => ({
    id: `cat-inc-${i}`,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: 'income' as const,
    isDefault: true,
  })),
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: 'pm-1', name: 'Credit Card', isDefault: true, allowInstallments: true },
  { id: 'pm-2', name: 'Debit Card', isDefault: true, allowInstallments: false },
  { id: 'pm-3', name: 'Money Transfer', isDefault: true, allowInstallments: false },
];

export const DEFAULT_BANKS: BankItem[] = [
  { id: 'bank-1', name: 'Nubank', isDefault: true },
  { id: 'bank-2', name: 'Itaú', isDefault: true },
  { id: 'bank-3', name: 'Bradesco', isDefault: true },
  { id: 'bank-4', name: 'Caixa', isDefault: true },
];
