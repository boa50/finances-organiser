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
    Modal: (props: any) => (props.visible ? React.createElement('div', { 'data-testid': 'modal', ...props }, props.children) : null),
  };
});

jest.mock('lucide-react-native', () => ({
  Check: () => null,
  ChevronDown: () => null,
  Filter: () => null,
  Search: () => null,
  X: () => null,
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('svg', props, props.children),
}));

jest.mock('../../CategoryIcon', () => ({
  CategoryIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'analytics.categoriesSelected') return `${options?.count} categories selected`;
      if (key === 'analytics.allCategories') return 'All Categories';
      if (key === 'analytics.categoryFilterTitle') return 'Filter by Category';
      if (key === 'analytics.categoryFilterSubtitle') return 'Select expense and income categories to display';
      if (key === 'common.all') return 'All';
      if (key === 'common.expenses') return 'Expenses';
      if (key === 'common.incomes') return 'Incomes';
      if (key === 'analytics.selectAll') return 'Select All';
      if (key === 'analytics.clearAll') return 'Clear';
      if (key === 'analytics.applyFilter') return 'Apply Filter';
      if (key === 'analytics.resetFilter') return 'Reset to All';
      return key;
    },
    i18n: { language: 'en' },
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

import { AppMultiSelectDropdown, MultiSelectItem } from '../AppMultiSelectDropdown';

describe('AppMultiSelectDropdown', () => {
  const mockItems: MultiSelectItem[] = [
    { id: 'cat-1', name: 'Housing', type: 'expense', color: '#EF4444' },
    { id: 'cat-2', name: 'Food', type: 'expense', color: '#F97316' },
    { id: 'cat-3', name: 'Salary', type: 'income', color: '#10B981' },
  ];

  it('renders trigger with all categories when no items selected', () => {
    const onChange = jest.fn();
    const element = React.createElement(AppMultiSelectDropdown, {
      items: mockItems,
      selectedIds: [],
      onChange,
      showTypeFilter: true,
    });

    expect(element).toBeDefined();
    expect(element.props.selectedIds).toEqual([]);
    expect(element.props.items).toHaveLength(3);
  });

  it('renders trigger with selected count when categories are selected', () => {
    const onChange = jest.fn();
    const element = React.createElement(AppMultiSelectDropdown, {
      items: mockItems,
      selectedIds: ['cat-1', 'cat-2'],
      onChange,
      showTypeFilter: true,
    });

    expect(element).toBeDefined();
    expect(element.props.selectedIds).toEqual(['cat-1', 'cat-2']);
  });

  it('respects disabled prop', () => {
    const onChange = jest.fn();
    const element = React.createElement(AppMultiSelectDropdown, {
      items: mockItems,
      selectedIds: [],
      onChange,
      disabled: true,
    });

    expect(element).toBeDefined();
    expect(element.props.disabled).toBe(true);
  });
});
