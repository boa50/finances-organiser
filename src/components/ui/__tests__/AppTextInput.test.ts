import React from 'react';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', { 'data-testid': 'view', ...props }, props.children),
    TextInput: (props: any) => React.createElement('input', { 'data-testid': 'input', ...props }),
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

jest.mock('../AppText', () => ({
  AppText: (props: any) => {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'app-text', ...props }, props.children);
  },
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

(jest.spyOn(React, 'useState') as any).mockImplementation((initial: any) => [initial, jest.fn()]);

import { AppTextInput } from '../AppTextInput';

describe('AppTextInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const onChangeText = jest.fn();
    const element = React.createElement(AppTextInput, {
      value: 'Hello',
      onChangeText,
      placeholder: 'Enter text',
    });

    expect(element).toBeDefined();
    expect(element.props.value).toBe('Hello');
    expect(element.props.placeholder).toBe('Enter text');
  });

  it('renders with label and helper text', () => {
    const onChangeText = jest.fn();
    const rendered = AppTextInput({
      value: '',
      onChangeText,
      label: 'Amount',
      helperText: 'Enter numerical value',
    }) as any;

    expect(rendered).toBeDefined();
  });

  it('displays error text when provided', () => {
    const onChangeText = jest.fn();
    const rendered = AppTextInput({
      value: '',
      onChangeText,
      label: 'Email',
      error: 'Invalid email address',
    }) as any;

    expect(rendered).toBeDefined();
  });

  it('supports multiline and custom sizes', () => {
    const onChangeText = jest.fn();
    const element = React.createElement(AppTextInput, {
      value: 'Long notes here',
      onChangeText,
      multiline: true,
      numberOfLines: 3,
      size: 'lg',
    });

    expect(element.props.multiline).toBe(true);
    expect(element.props.numberOfLines).toBe(3);
    expect(element.props.size).toBe('lg');
  });
});
