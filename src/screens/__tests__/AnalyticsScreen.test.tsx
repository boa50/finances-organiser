import React from 'react';
import { AnalyticsScreen } from '../AnalyticsScreen';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  ScrollView: ({ children }: any) => children,
  StyleSheet: { create: (s: any) => s },
  View: ({ children }: any) => children,
}));

let hookState: any[] = [];
let hookIndex = 0;

beforeEach(() => {
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
(jest.spyOn(React, 'useEffect') as any).mockImplementation((effect: any) => {
  effect();
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../services/tursoService', () => ({
  tursoService: {
    getTransactionTotals: jest.fn().mockResolvedValue({ byCurrency: {} }),
  },
}));

jest.mock('lucide-react-native', () => ({
  ArrowDownLeft: () => null,
  ArrowUpRight: () => null,
  Scale: () => null,
}));

jest.mock('../../components/analytics', () => ({
  MonthlyBreakdownCharts: () => 'MonthlyBreakdownCharts',
}));

jest.mock('../../components/charts', () => ({
  EvolutionTrendChart: () => 'EvolutionTrendChart',
}));

jest.mock('../../components/ui', () => ({
  AppCard: ({ children }: any) => children,
  AppText: ({ children }: any) => children,
  AppLoadingView: ({ message }: any) => `AppLoadingView:${message}`,
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

describe('AnalyticsScreen', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      title: 'Salary',
      amount: 5000,
      currencyId: 'BRL',
      type: 'income' as const,
      date: '2026-08-01',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  it('renders AppLoadingView and calls onLoadAllTransactions when isFullyLoaded is false', () => {
    const onLoadAllTransactions = jest.fn();
    const element: any = AnalyticsScreen({
      transactions: mockTransactions,
      isFullyLoaded: false,
      isLoadingAllTransactions: true,
      onLoadAllTransactions,
    });

    expect(element?.props?.message).toBe('analytics.loadingChartData');
    expect(onLoadAllTransactions).toHaveBeenCalledTimes(1);
  });

  it('renders content when isFullyLoaded is true', () => {
    const element: any = AnalyticsScreen({
      transactions: mockTransactions,
      isFullyLoaded: true,
      isLoadingAllTransactions: false,
    });

    expect(element?.props?.message).toBeUndefined();
  });
});
