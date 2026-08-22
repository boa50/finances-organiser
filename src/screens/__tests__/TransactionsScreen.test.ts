jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Pressable: 'Pressable',
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Alert: { alert: jest.fn() },
}));

const mockConfirmAction = jest.fn();
jest.mock('../../utils/dialogs', () => ({
  confirmAction: (options: any) => mockConfirmAction(options),
}));

const mockDeleteTransaction = jest.fn();
const mockDeleteTransactionGroup = jest.fn();
jest.mock('../../services/tursoService', () => ({
  tursoService: {
    deleteTransaction: (...args: any[]) => mockDeleteTransaction(...args),
    deleteTransactionGroup: (...args: any[]) => mockDeleteTransactionGroup(...args),
    duplicateTransaction: jest.fn(),
    clearAllTransactions: jest.fn(),
  },
}));

const mockShowToast = jest.fn().mockReturnValue('toast-1');
const mockUpdateToast = jest.fn();
jest.mock('../../contexts', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    updateToast: mockUpdateToast,
  }),
}));

jest.mock('../../theme', () => {
  const actual = jest.requireActual('../../theme');
  return {
    __esModule: true,
    default: actual.default,
    useTheme: () => ({
      theme: actual.darkTheme,
      isDark: true,
      mode: 'dark',
    }),
  };
});

import React from 'react';
(jest.spyOn(React, 'useState') as any).mockImplementation((init: any) => [typeof init === 'function' ? init() : init, jest.fn()]);
(jest.spyOn(React, 'useCallback') as any).mockImplementation((fn: any) => fn);
(jest.spyOn(React, 'useMemo') as any).mockImplementation((fn: any) => fn());
(jest.spyOn(React, 'useEffect') as any).mockImplementation(() => {});

let capturedItemCardProps: any = null;
jest.mock('../../components/transactions', () => ({
  TransactionItemCard: (props: any) => {
    capturedItemCardProps = props;
    return null;
  },
  TransactionEditModal: 'TransactionEditModal',
}));

let capturedFlashListProps: any = null;
jest.mock('@shopify/flash-list', () => ({
  FlashList: (props: any) => {
    capturedFlashListProps = props;
    return null;
  },
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

    it('accepts pagination props (onLoadMore, isLoadingMore, isFullyLoaded, totalCount)', () => {
      const { TransactionsScreen } = require('../TransactionsScreen');
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const mockLoadMore = jest.fn().mockResolvedValue(undefined);
      const element = require('react').createElement(TransactionsScreen, {
        transactions: mockTransactions,
        onRefresh: mockRefresh,
        onLoadMore: mockLoadMore,
        isLoadingMore: true,
        isFullyLoaded: false,
        totalCount: 100,
      });

      expect(element).toBeDefined();
      expect(element.props.onLoadMore).toBe(mockLoadMore);
      expect(element.props.isLoadingMore).toBe(true);
      expect(element.props.isFullyLoaded).toBe(false);
      expect(element.props.totalCount).toBe(100);
    });

    describe('Transaction deletion handling', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('prompts confirmation and deletes single transaction when confirmed', async () => {
        const { TransactionsScreen } = require('../TransactionsScreen');
        const mockRefresh = jest.fn().mockResolvedValue(undefined);
        mockDeleteTransaction.mockResolvedValue(true);

        const tree = TransactionsScreen({
          transactions: mockTransactions,
          onRefresh: mockRefresh,
        }) as any;

        const flashListElement = tree.props.children[0].props.children[1].props.children;
        expect(flashListElement).toBeDefined();

        const itemCardWrapper = flashListElement.props.renderItem({
          item: {
            type: 'transaction',
            id: 'tx-2',
            transaction: mockTransactions[1],
          },
        });

        const itemCard = itemCardWrapper.props.children;
        expect(typeof itemCard.props.onDelete).toBe('function');

        // Trigger delete
        itemCard.props.onDelete(mockTransactions[1]);

        expect(mockConfirmAction).toHaveBeenCalledTimes(1);
        const confirmCall = mockConfirmAction.mock.calls[0][0];
        expect(confirmCall.title).toBe('transactions.deleteTransactionTitle');
        expect(confirmCall.destructive).toBe(true);

        // Confirm deletion
        await confirmCall.onConfirm();

        expect(mockDeleteTransaction).toHaveBeenCalledWith('tx-2');
        expect(mockDeleteTransactionGroup).not.toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });

      it('prompts to delete all installments in group on installment deletion', async () => {
        const { TransactionsScreen } = require('../TransactionsScreen');
        const mockRefresh = jest.fn().mockResolvedValue(undefined);
        mockDeleteTransactionGroup.mockResolvedValue(true);

        const installmentTx: Transaction = {
          id: 'tx-inst-1',
          type: 'expense',
          title: 'Smartphone',
          amount: 500,
          currencyId: 'BRL',
          date: '2026-08-01T10:00:00.000Z',
          createdAt: '2026-08-01T10:00:00.000Z',
          installments: 3,
          installmentNumber: 1,
          installmentGroupId: 'grp-smart-123',
        };

        const tree = TransactionsScreen({
          transactions: [installmentTx],
          onRefresh: mockRefresh,
        }) as any;

        const flashListElement = tree.props.children[0].props.children[1].props.children;
        const itemCardWrapper = flashListElement.props.renderItem({
          item: {
            type: 'transaction',
            id: installmentTx.id,
            transaction: installmentTx,
          },
        });

        const itemCard = itemCardWrapper.props.children;

        // Trigger delete on installment transaction
        itemCard.props.onDelete(installmentTx);

        expect(mockConfirmAction).toHaveBeenCalledTimes(1);
        const confirmCall = mockConfirmAction.mock.calls[0][0];
        expect(confirmCall.title).toBe('transactions.deleteInstallmentsTitle');
        expect(confirmCall.destructive).toBe(true);

        // Confirm deletion
        await confirmCall.onConfirm();

        expect(mockDeleteTransactionGroup).toHaveBeenCalledWith('grp-smart-123', installmentTx);
        expect(mockDeleteTransaction).not.toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });

      it('cancels deletion when confirmation is dismissed/cancelled', () => {
        const { TransactionsScreen } = require('../TransactionsScreen');
        const mockRefresh = jest.fn().mockResolvedValue(undefined);

        const installmentTx: Transaction = {
          id: 'tx-inst-2',
          type: 'expense',
          title: 'Laptop',
          amount: 1000,
          currencyId: 'BRL',
          date: '2026-08-01T10:00:00.000Z',
          createdAt: '2026-08-01T10:00:00.000Z',
          installments: 5,
          installmentNumber: 2,
          installmentGroupId: 'grp-laptop-456',
        };

        const tree = TransactionsScreen({
          transactions: [installmentTx],
          onRefresh: mockRefresh,
        }) as any;

        const flashListElement = tree.props.children[0].props.children[1].props.children;
        const itemCardWrapper = flashListElement.props.renderItem({
          item: {
            type: 'transaction',
            id: installmentTx.id,
            transaction: installmentTx,
          },
        });

        const itemCard = itemCardWrapper.props.children;
        itemCard.props.onDelete(installmentTx);

        expect(mockConfirmAction).toHaveBeenCalledTimes(1);
        // Do not invoke onConfirm (simulates user clicking Cancel)

        expect(mockDeleteTransactionGroup).not.toHaveBeenCalled();
        expect(mockDeleteTransaction).not.toHaveBeenCalled();
        expect(mockRefresh).not.toHaveBeenCalled();
      });
    });
  });
});

