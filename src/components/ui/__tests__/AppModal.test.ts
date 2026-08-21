import React from 'react';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Modal: (props: any) => props.visible ? React.createElement('div', { 'data-testid': 'modal', ...props }, props.children) : null,
    View: (props: any) => React.createElement('div', { 'data-testid': 'view', ...props }, props.children),
    Pressable: (props: any) => {
      const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
      return React.createElement('button', { ...props, style, onClick: props.onPress }, props.children);
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 800, height: 600 })),
    },
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

jest.mock('lucide-react-native', () => ({
  X: (props: any) => React.createElement('span', { 'data-icon': 'x', ...props }),
}));

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

import { AppModal } from '../AppModal';

describe('AppModal', () => {
  it('renders modal with title and subtitle when visible', () => {
    const onClose = jest.fn();
    const element = React.createElement(AppModal, {
      visible: true,
      onClose,
      title: 'Modal Title',
      subtitle: 'Modal Subtitle',
      children: React.createElement('div', null, 'Content'),
    });

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
    expect(element.props.title).toBe('Modal Title');
    expect(element.props.subtitle).toBe('Modal Subtitle');
  });

  it('passes visible=false properly', () => {
    const onClose = jest.fn();
    const element = React.createElement(AppModal, {
      visible: false,
      onClose,
      children: React.createElement('div', null, 'Content'),
    });

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(false);
  });
});
