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
    getTransactions: jest.fn().mockResolvedValue([]),
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

let hookState: any[] = [];
let hookIndex = 0;

describe('useAppData - Connection Gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hookState = [];
    hookIndex = 0;
  });

  (jest.spyOn(React, 'useState') as any).mockImplementation((initial: any) => {
    const idx = hookIndex++;
    if (hookState[idx] === undefined) {
      hookState[idx] = typeof initial === 'function' ? initial() : initial;
    }
    const setValue = (val: any) => {
      hookState[idx] = typeof val === 'function' ? val(hookState[idx]) : val;
    };
    return [hookState[idx], setValue];
  });
  (jest.spyOn(React, 'useCallback') as any).mockImplementation((fn: any) => fn);
  (jest.spyOn(React, 'useEffect') as any).mockImplementation(() => {});
  (jest.spyOn(React, 'useRef') as any).mockImplementation((init: any) => ({ current: init }));

  it('exposes connection gating states and initializes bootstrap', () => {
    let hookResult: any = null;

    function TestComponent({ enabled }: { enabled: boolean }) {
      hookResult = useAppData(enabled);
      return null;
    }

    TestComponent({ enabled: true });
    expect(hookResult).toBeDefined();
    expect(hookResult?.isLoadingAllTransactions).toBe(false);
    expect(typeof hookResult?.loadAllTransactions).toBe('function');
  });

  it('calls tursoService.getTransactions when loadAllTransactions is triggered', async () => {
    const mockFullTx = [
      { id: 'tx-1', title: 'Coffee', amount: 10, type: 'expense', date: '2026-01-01', currencyId: 'BRL', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'tx-2', title: 'Salary', amount: 5000, type: 'income', date: '2026-01-02', currencyId: 'BRL', createdAt: '2026-01-02T00:00:00.000Z' },
    ];
    (tursoService.getTransactions as jest.Mock).mockResolvedValueOnce(mockFullTx);

    let hookResult: any = null;
    function TestComponent({ enabled }: { enabled: boolean }) {
      hookIndex = 0;
      hookResult = useAppData(enabled);
      return null;
    }

    TestComponent({ enabled: true });

    await hookResult?.loadAllTransactions();
    TestComponent({ enabled: true });

    expect(tursoService.getTransactions).toHaveBeenCalledTimes(1);
    expect(hookResult?.transactions).toEqual(mockFullTx);
    expect(hookResult?.totalCount).toBe(2);
    expect(hookResult?.isFullyLoaded).toBe(true);
  });
});
