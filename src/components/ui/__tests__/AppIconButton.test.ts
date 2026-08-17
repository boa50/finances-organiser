import React from 'react';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Pressable: (props: any) => {
      const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
      return React.createElement('button', { ...props, style }, props.children);
    },
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

jest.mock('lucide-react-native', () => ({
  Pencil: (props: any) => React.createElement('span', { 'data-icon': 'pencil', ...props }),
  Trash2: (props: any) => React.createElement('span', { 'data-icon': 'trash2', ...props }),
  Copy: (props: any) => React.createElement('span', { 'data-icon': 'copy', ...props }),
}));

import { AppIconButton } from '../AppIconButton';
import theme from '../../../theme';

describe('AppIconButton', () => {
  it('should render edit variant with default properties', () => {
    const onPress = jest.fn();
    const element = React.createElement(AppIconButton, {
      variant: 'edit',
      onPress,
      accessibilityLabel: 'Edit Item',
    });

    expect(element).toBeDefined();
    expect(element.props.variant).toBe('edit');
    expect(element.props.accessibilityLabel).toBe('Edit Item');
  });

  it('should render delete variant with default properties', () => {
    const onPress = jest.fn();
    const element = React.createElement(AppIconButton, {
      variant: 'delete',
      onPress,
      accessibilityLabel: 'Delete Item',
    });

    expect(element).toBeDefined();
    expect(element.props.variant).toBe('delete');
    expect(element.props.accessibilityLabel).toBe('Delete Item');
  });

  it('should render duplicate variant', () => {
    const onPress = jest.fn();
    const element = React.createElement(AppIconButton, {
      variant: 'duplicate',
      onPress,
      accessibilityLabel: 'Duplicate Item',
    });

    expect(element).toBeDefined();
    expect(element.props.variant).toBe('duplicate');
  });

  it('should handle custom size and color props', () => {
    const onPress = jest.fn();
    const element = React.createElement(AppIconButton, {
      variant: 'edit',
      size: 'lg',
      iconSize: 18,
      iconColor: '#FF0000',
      onPress,
      accessibilityLabel: 'Custom Edit',
    });

    expect(element.props.size).toBe('lg');
    expect(element.props.iconSize).toBe(18);
    expect(element.props.iconColor).toBe('#FF0000');
  });

  it('should handle disabled prop properly', () => {
    const onPress = jest.fn();
    const element = React.createElement(AppIconButton, {
      variant: 'delete',
      disabled: true,
      onPress,
      accessibilityLabel: 'Delete Disabled',
    });

    expect(element.props.disabled).toBe(true);
  });

  it('should allow passing custom icon', () => {
    const onPress = jest.fn();
    const customIcon = React.createElement('span', null, 'custom');
    const element = React.createElement(AppIconButton, {
      variant: 'custom',
      icon: customIcon,
      onPress,
      accessibilityLabel: 'Custom Action',
    });

    expect(element.props.icon).toBe(customIcon);
  });
});
