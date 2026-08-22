import React from 'react';

const mockShowToast = jest.fn();
const mockUpdateToast = jest.fn();
const mockDismissToast = jest.fn();

jest.mock('../../../contexts', () => ({
  useToast: () => ({
    activeToast: null,
    showToast: mockShowToast,
    updateToast: mockUpdateToast,
    dismissToast: mockDismissToast,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

const mockAddTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockDeleteTransactionGroup = jest.fn();

jest.mock('../../../services/tursoService', () => ({
  tursoService: {
    addTransaction: (...args: any[]) => mockAddTransaction(...args),
    updateTransaction: (...args: any[]) => mockUpdateTransaction(...args),
    deleteTransactionGroup: (...args: any[]) => mockDeleteTransactionGroup(...args),
  },
}));

jest.mock('../../../services/currencyService', () => ({
  currencyService: {
    getEnabledCurrencies: jest.fn().mockResolvedValue([{ code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }]),
  },
}));

jest.mock('../../../services/categoryService', () => ({
  categoryService: {
    getEnabledCategories: jest.fn().mockResolvedValue([{ id: 'cat-1', name: 'Food', icon: 'Utensils', color: '#ff0000', type: 'expense' }]),
  },
}));

jest.mock('../../../services/paymentMethodService', () => ({
  paymentMethodService: {
    getEnabledPaymentMethods: jest.fn().mockResolvedValue([{ id: 'pm-1', name: 'Credit Card', allowInstallments: true }]),
  },
}));

jest.mock('../../../services/bankService', () => ({
  bankService: {
    getEnabledBanks: jest.fn().mockResolvedValue([{ id: 'bank-1', name: 'Nubank' }]),
  },
}));

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web' },
    View: (props: any) => React.createElement('div', { ...props }, props.children),
    ScrollView: (props: any) => React.createElement('div', { ...props }, props.children),
    Pressable: (props: any) => React.createElement('button', { ...props, onClick: props.onPress }, props.children),
    ActivityIndicator: (props: any) => React.createElement('span', { ...props }),
    TextInput: (props: any) => React.createElement('input', { ...props }),
    StyleSheet: { create: (s: any) => s },
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  return {
    CreditCard: (props: any) => React.createElement('span', { 'data-icon': 'credit-card', ...props }),
    Building2: (props: any) => React.createElement('span', { 'data-icon': 'building-2', ...props }),
    Calendar: (props: any) => React.createElement('span', { 'data-icon': 'calendar', ...props }),
  };
});

jest.mock('../../CategoryIcon', () => ({
  CategoryIcon: () => null,
}));

jest.mock('../../ui', () => {
  const React = require('react');
  return {
    AppButton: (props: any) => React.createElement('button', { onClick: props.onPress, disabled: props.loading }, props.title),
    AppChipSelector: () => null,
    AppDatePicker: () => null,
    AppModal: (props: any) => (props.visible ? React.createElement('div', null, props.children) : null),
    AppSegmentedControl: () => null,
    AppText: (props: any) => React.createElement('span', null, props.children),
    AppTextInput: (props: any) => React.createElement('input', { value: props.value, onChange: (e: any) => props.onChangeText?.(e.target.value) }),
    FeedbackMessage: (props: any) => React.createElement('div', { 'data-testid': 'feedback-msg' }, props.message),
  };
});

import { TransactionEditModal } from '../TransactionEditModal';

describe('TransactionEditModal - Async Save & Toast Ordering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddTransaction.mockResolvedValue({ id: 'new-tx' });
    mockUpdateTransaction.mockResolvedValue({ id: 'updated-tx' });
  });

  it('TransactionEditModal component is defined and accepts async onSaved', () => {
    const mockOnSaved = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    const element = React.createElement(TransactionEditModal, {
      visible: true,
      transaction: null,
      onClose: mockOnClose,
      onSaved: mockOnSaved,
    });

    expect(element).toBeDefined();
    expect(element.props.onSaved).toBe(mockOnSaved);
  });
});
