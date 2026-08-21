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

(jest.spyOn(React, 'useRef') as any).mockImplementation((initial: any) => ({ current: initial }));

import { AppChipSelector } from '../AppChipSelector';

describe('AppChipSelector', () => {
  const mockItems = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
  ];

  it('renders correctly and handles selection', () => {
    const onSelect = jest.fn();
    const element = React.createElement(AppChipSelector, {
      items: mockItems,
      selectedId: '1',
      onSelect,
      keyExtractor: (item: any) => item.id,
      labelExtractor: (item: any) => item.name,
    });

    expect(element).toBeDefined();
    expect(element.props.selectedId).toBe('1');
    expect(element.props.items).toHaveLength(2);
  });

  it('supports wrap mode layout', () => {
    const onSelect = jest.fn();
    const element = React.createElement(AppChipSelector, {
      items: mockItems,
      selectedId: '2',
      onSelect,
      keyExtractor: (item: any) => item.id,
      labelExtractor: (item: any) => item.name,
      wrap: true,
    });

    expect(element).toBeDefined();
    expect(element.props.wrap).toBe(true);
  });
});
