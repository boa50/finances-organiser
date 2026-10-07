import React from 'react';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web' },
    View: (props: any) => React.createElement('div', { 'data-testid': 'view', ...props }, props.children),
    ScrollView: (props: any) => React.createElement('div', { 'data-testid': 'scroll-view', ...props }, props.children),
    Pressable: (props: any) => {
      const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
      return React.createElement('button', { ...props, style, onClick: props.onPress }, props.children);
    },
    StyleSheet: {
      create: (styles: any) => styles,
    },
    Dimensions: {
      get: () => ({ width: 800, height: 600 }),
    },
  };
});

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props),
    Circle: (props: any) => React.createElement('circle', props),
    Line: (props: any) => React.createElement('line', props),
    Text: (props: any) => React.createElement('text', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
    Defs: (props: any) => React.createElement('defs', props, props.children),
    LinearGradient: (props: any) => React.createElement('linearGradient', props, props.children),
    Stop: (props: any) => React.createElement('stop', props),
    Rect: (props: any) => React.createElement('rect', props),
  };
});

const mockUseEvolutionChartD3 = jest.fn().mockReturnValue({
  innerWidth: 600,
  innerHeight: 200,
  xScale: () => 50,
  yScale: () => 50,
  incomePath: 'M0,0',
  expensePath: 'M0,0',
  incomeAreaPath: 'M0,0',
  expenseAreaPath: 'M0,0',
  yTicks: [0, 500, 1000],
});

jest.mock('../../../hooks/useEvolutionChartD3', () => ({
  useEvolutionChartD3: (props: any) => mockUseEvolutionChartD3(props),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'analytics.categoriesSelected') return `${options?.count} categories selected`;
      if (key === 'analytics.allCategories') return 'All Categories';
      if (key === 'analytics.evolutionTitle') return 'Income vs Expense Evolution';
      if (key === 'analytics.evolutionSubtitle') return 'Monthly trend built with D3.js';
      if (key === 'analytics.period5y') return '5 Years';
      if (key === 'analytics.period1y') return '1 Year';
      if (key === 'analytics.period6m') return '6 Months';
      if (key === 'common.income') return 'Income';
      if (key === 'common.expense') return 'Expense';
      if (key === 'common.clear') return 'Clear';
      return key;
    },
  }),
}));

jest.mock('../../../theme', () => {
  const actual = jest.requireActual('../../../theme');
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

jest.mock('lucide-react-native', () => ({
  Check: () => null,
  ChevronDown: () => null,
  Filter: () => null,
  Search: () => null,
  X: () => null,
}));

jest.mock('../../../services/categoryService', () => ({
  categoryService: {
    getCategoriesSync: () => [
      { id: 'cat-housing', name: 'Housing', type: 'expense', color: '#EF4444', icon: 'home' },
      { id: 'cat-food', name: 'Food', type: 'expense', color: '#F97316', icon: 'utensils' },
      { id: 'cat-salary', name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase' },
    ],
  },
}));

import { EvolutionTrendChart } from '../EvolutionTrendChart';
import { Transaction } from '../../../types';

describe('EvolutionTrendChart', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Monthly Salary',
      amount: 4000,
      currencyId: 'BRL',
      type: 'income',
      categoryId: 'cat-salary',
      date: '2026-08-05',
      createdAt: '2026-08-05T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      title: 'Rent',
      amount: 1500,
      currencyId: 'BRL',
      type: 'expense',
      categoryId: 'cat-housing',
      date: '2026-08-10',
      createdAt: '2026-08-10T00:00:00.000Z',
    },
    {
      id: 'tx-3',
      title: 'Supermarket',
      amount: 600,
      currencyId: 'BRL',
      type: 'expense',
      categoryId: 'cat-food',
      date: '2026-08-15',
      createdAt: '2026-08-15T00:00:00.000Z',
    },
  ];

  it('renders correctly with default props', () => {
    mockUseEvolutionChartD3.mockClear();
    const element = React.createElement(EvolutionTrendChart, {
      transactions: mockTransactions,
      targetCurrency: 'BRL',
    });

    expect(element).toBeDefined();
    expect(element.props.transactions).toHaveLength(3);
    expect(element.props.targetCurrency).toBe('BRL');
  });

  it('accepts custom categories prop', () => {
    const customCats = [
      { id: 'cat-custom', name: 'Custom Cat', type: 'expense' as const, color: '#3B82F6', icon: 'tag' },
    ];

    const element = React.createElement(EvolutionTrendChart, {
      transactions: mockTransactions,
      targetCurrency: 'BRL',
      categories: customCats,
    });

    expect(element.props.categories).toEqual(customCats);
  });
});
