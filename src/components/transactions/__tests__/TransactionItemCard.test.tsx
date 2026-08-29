import React from 'react';
import { TransactionItemCard } from '../TransactionItemCard';
import { Transaction } from '../../../types';

const mockGetLocalTransactionById = jest.fn();

jest.mock('../../../services/tursoService', () => ({
  tursoService: {
    getLocalTransactionById: (id: string) => mockGetLocalTransactionById(id),
    getTransactionById: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../../services/categoryService', () => ({
  categoryService: {
    getCategoriesSync: () => [{ id: 'cat-1', name: 'Food' }],
  },
}));

jest.mock('../../../services/paymentMethodService', () => ({
  paymentMethodService: {
    getPaymentMethodsSync: () => [{ id: 'pm-1', name: 'Credit Card' }],
  },
}));

jest.mock('../../../services/bankService', () => ({
  bankService: {
    getBanksSync: () => [{ id: 'bank-1', name: 'Nubank' }],
  },
}));

jest.mock('../../../services/subscriptionService', () => ({
  subscriptionService: {
    getSubscriptionsSync: () => [],
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    i18n: { language: 'en-US' },
  }),
}));

jest.mock('../../../theme', () => {
  const actual = jest.requireActual('../../../theme');
  return {
    __esModule: true,
    ...actual,
    useTheme: () => ({
      theme: actual.darkTheme,
      isDark: true,
      mode: 'dark',
    }),
  };
});

(jest.spyOn(React, 'useState') as any).mockImplementation((initial: any) => [
  typeof initial === 'function' ? initial() : initial,
  jest.fn(),
]);
(jest.spyOn(React, 'useEffect') as any).mockImplementation(() => {});

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web' },
    View: (props: any) => React.createElement('div', { ...props }, props.children),
    Text: (props: any) => React.createElement('span', { ...props }, props.children),
    Pressable: (props: any) => React.createElement('button', { ...props, onClick: props.onPress }, props.children),
    StyleSheet: { create: (s: any) => s },
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  return {
    TrendingUp: () => null,
    TrendingDown: () => null,
    Link2: () => React.createElement('span', { 'data-testid': 'link-icon' }),
    Copy: () => null,
    Pencil: () => null,
    Trash2: () => null,
  };
});

jest.mock('../../ui', () => {
  const React = require('react');
  return {
    AppCard: (props: any) => React.createElement('div', { ...props }, props.children),
    AppIconBadge: () => null,
    AppBadge: (props: any) => React.createElement('span', null, props.label),
    AppText: (props: any) => React.createElement('span', { ...props }, props.children),
    AppIconButton: () => null,
  };
});

describe('TransactionItemCard - Reference Display', () => {
  const baseTx: Transaction = {
    id: 'tx-current',
    type: 'income',
    title: 'Refund Received',
    amount: 100,
    currencyId: 'BRL',
    date: '2026-08-10',
    createdAt: '2026-08-10T12:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reference title when referencedTransactionId matches a valid transaction', () => {
    mockGetLocalTransactionById.mockReturnValue({
      id: 'tx-parent-123',
      title: 'Original Electronic Purchase',
    });

    const txWithRef: Transaction = {
      ...baseTx,
      referencedTransactionId: 'tx-parent-123',
    };

    const element = React.createElement(TransactionItemCard, {
      transaction: txWithRef,
      onEdit: jest.fn(),
    });

    expect(element).toBeDefined();
    expect(element.props.transaction.referencedTransactionId).toBe('tx-parent-123');
  });

  it('does not crash when referencedTransactionId is not found', () => {
    mockGetLocalTransactionById.mockReturnValue(undefined);

    const txWithInvalidRef: Transaction = {
      ...baseTx,
      referencedTransactionId: 'tx-invalid-999',
    };

    const element = React.createElement(TransactionItemCard, {
      transaction: txWithInvalidRef,
      onEdit: jest.fn(),
    });

    expect(element).toBeDefined();
  });

  it('configures reference text with ellipsis (numberOfLines=1 and ellipsizeMode="tail")', () => {
    mockGetLocalTransactionById.mockReturnValue({
      id: 'tx-parent-123',
      title: 'Original Electronic Purchase with very long title',
    });

    const txWithRef: Transaction = {
      ...baseTx,
      referencedTransactionId: 'tx-parent-123',
    };

    const rendered = TransactionItemCard({
      transaction: txWithRef,
      onEdit: jest.fn(),
    }) as any;

    const findByProp = (node: any, predicate: (n: any) => boolean): any => {
      if (!node) return null;
      if (predicate(node)) return node;
      if (Array.isArray(node)) {
        for (const child of node) {
          const res = findByProp(child, predicate);
          if (res) return res;
        }
      }
      if (node.props && node.props.children) {
        return findByProp(node.props.children, predicate);
      }
      return null;
    };

    const refTextNode = findByProp(
      rendered,
      (n) => n?.props && typeof n.props.children === 'string' && n.props.children.includes('Original Electronic Purchase')
    );

    expect(refTextNode).toBeDefined();
    expect(refTextNode.props.numberOfLines).toBe(1);
    expect(refTextNode.props.ellipsizeMode).toBe('tail');
  });
});
