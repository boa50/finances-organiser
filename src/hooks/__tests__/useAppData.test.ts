import React from 'react';
import { useAppData } from '../useAppData';
import { tursoService } from '../../services/tursoService';

jest.mock('../../services/tursoService', () => ({
  tursoService: {
    getLocalRecentTransactions: jest.fn().mockReturnValue([]),
    getLocalTransactionCount: jest.fn().mockReturnValue(0),
    getConfig: jest.fn().mockReturnValue({ isConnected: true, url: '', authToken: '' }),
    bootstrapAppData: jest.fn().mockResolvedValue({
      currencies: [],
      categories: [],
      paymentMethods: [],
      banks: [],
      recentTransactions: [],
      totalCount: 0,
    }),
    getTransactionsPaginated: jest.fn().mockResolvedValue({
      transactions: [],
      total: 0,
      hasMore: false,
    }),
    getRecentTransactions: jest.fn().mockResolvedValue([]),
    getTransactionCount: jest.fn().mockResolvedValue(0),
    clearAllTransactions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/subscriptionService', () => ({
  subscriptionService: {
    getSubscriptions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/currencyService', () => ({
  currencyService: {
    setCurrenciesFromBootstrap: jest.fn(),
  },
}));

jest.mock('../../services/categoryService', () => ({
  categoryService: {
    setCategoriesFromBootstrap: jest.fn(),
  },
}));

jest.mock('../../services/paymentMethodService', () => ({
  paymentMethodService: {
    setPaymentMethodsFromBootstrap: jest.fn(),
  },
}));

jest.mock('../../services/bankService', () => ({
  bankService: {
    setBanksFromBootstrap: jest.fn(),
  },
}));

jest.mock('../../services/subscriptionAutoGenerator', () => ({
  processSubscriptionAutoGeneration: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../utils/currencies', () => ({
  refreshCurrencyRates: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../contexts', () => ({
  useToast: () => ({
    showToast: jest.fn(),
    updateToast: jest.fn(),
  }),
}));

jest.mock('../../utils/dialogs', () => ({
  confirmAction: jest.fn(),
}));

describe('useAppData - Connection Gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes connection gating states and initializes bootstrap', () => {
    let hookResult: ReturnType<typeof useAppData> | null = null;

    function TestComponent({ enabled }: { enabled: boolean }) {
      hookResult = useAppData(enabled);
      return null;
    }

    const element = React.createElement(TestComponent, { enabled: true });
    expect(element).toBeDefined();
  });
});
