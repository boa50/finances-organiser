jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Pressable: 'Pressable',
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Alert: { alert: jest.fn() },
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: 'FlashList',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => (opts?.count !== undefined ? `${k} (${opts.count})` : k),
    i18n: { language: 'en-US' },
  }),
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('lucide-react-native', () => ({
  Search: 'Search',
  Trash2: 'Trash2',
}));

jest.mock('../../components/transactions', () => ({
  TransactionItemCard: 'TransactionItemCard',
  TransactionEditModal: 'TransactionEditModal',
}));

jest.mock('../../components/ui', () => ({
  AppCard: 'AppCard',
  AppEmptyState: 'AppEmptyState',
  AppSectionHeader: 'AppSectionHeader',
  AppSegmentedControl: 'AppSegmentedControl',
  AppTextInput: 'AppTextInput',
  AppText: 'AppText',
}));

import { Transaction } from '../../types';
import { buildFlattenedTransactions, monthKey } from '../TransactionsScreen';

describe('TransactionsScreen helpers', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      title: 'Salary',
      amount: 5000,
      currencyId: 'BRL',
      date: '2026-08-01T10:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      title: 'Rent',
      amount: 1500,
      currencyId: 'BRL',
      date: '2026-08-05T10:00:00.000Z',
      createdAt: '2026-08-05T10:00:00.000Z',
    },
    {
      id: 'tx-3',
      type: 'expense',
      title: 'Groceries',
      amount: 500,
      currencyId: 'BRL',
      date: '2026-08-10T10:00:00.000Z',
      createdAt: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'tx-4',
      type: 'expense',
      title: 'Phone Bill',
      amount: 200,
      currencyId: 'BRL',
      date: '2026-07-15T10:00:00.000Z',
      createdAt: '2026-07-15T10:00:00.000Z',
    },
  ];

  describe('monthKey', () => {
    it('returns formatted year-month string for valid date', () => {
      expect(monthKey('2026-08-01T10:00:00.000Z')).toBe('2026-7');
    });

    it('returns "undated" for invalid date strings', () => {
      expect(monthKey('invalid-date')).toBe('undated');
    });
  });

  describe('buildFlattenedTransactions', () => {
    it('calculates positive net balance for August (5000 - 1500 - 500 = 3000)', () => {
      const flattened = buildFlattenedTransactions(mockTransactions, 'en-US');

      const augustHeader = flattened.find(
        (item) => item.type === 'header' && item.id.includes('2026-7')
      );
      expect(augustHeader).toBeDefined();
      if (augustHeader && augustHeader.type === 'header') {
        expect(augustHeader.netBalance).toBe(3000);
      }
    });

    it('calculates negative net balance for July (0 - 200 = -200)', () => {
      const flattened = buildFlattenedTransactions(mockTransactions, 'en-US');

      const julyHeader = flattened.find(
        (item) => item.type === 'header' && item.id.includes('2026-6')
      );
      expect(julyHeader).toBeDefined();
      if (julyHeader && julyHeader.type === 'header') {
        expect(julyHeader.netBalance).toBe(-200);
      }
    });

    it('handles zero net balance when income equals expense', () => {
      const equalTransactions: Transaction[] = [
        {
          id: 'tx-eq-1',
          type: 'income',
          title: 'Freelance',
          amount: 500,
          currencyId: 'BRL',
          date: '2026-06-01T10:00:00.000Z',
          createdAt: '2026-06-01T10:00:00.000Z',
        },
        {
          id: 'tx-eq-2',
          type: 'expense',
          title: 'Supplies',
          amount: 500,
          currencyId: 'BRL',
          date: '2026-06-02T10:00:00.000Z',
          createdAt: '2026-06-02T10:00:00.000Z',
        },
      ];

      const flattened = buildFlattenedTransactions(equalTransactions, 'en-US');
      const header = flattened.find((item) => item.type === 'header');
      expect(header).toBeDefined();
      if (header && header.type === 'header') {
        expect(header.netBalance).toBe(0);
      }
    });

    it('handles undated transactions and provides undatedLabel', () => {
      const undatedTransactions: Transaction[] = [
        {
          id: 'tx-undated',
          type: 'expense',
          title: 'Old Item',
          amount: 150,
          currencyId: 'BRL',
          date: 'not-a-date',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
      ];

      const flattened = buildFlattenedTransactions(
        undatedTransactions,
        'en-US',
        'Undated'
      );
      const header = flattened.find((item) => item.type === 'header');
      expect(header).toBeDefined();
      if (header && header.type === 'header') {
        expect(header.label).toBe('Undated');
        expect(header.netBalance).toBe(-150);
      }
    });
  });

  describe('TransactionsScreen component', () => {
    it('accepts async onRefresh prop and transactions list', () => {
      const { TransactionsScreen } = require('../TransactionsScreen');
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const element = require('react').createElement(TransactionsScreen, {
        transactions: mockTransactions,
        onRefresh: mockRefresh,
      });

      expect(element).toBeDefined();
      expect(element.props.onRefresh).toBe(mockRefresh);
    });
  });
});

