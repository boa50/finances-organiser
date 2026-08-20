import React from 'react';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web' },
    Animated: {
      Value: jest.fn(() => ({
        interpolate: jest.fn((opts) => opts.outputRange[0]),
      })),
      timing: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb()),
      })),
      View: (props: any) => React.createElement('div', { 'data-testid': 'animated-view', ...props }, props.children),
    },
    Pressable: (props: any) => {
      const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
      return React.createElement('button', { ...props, style, onClick: props.onPress }, props.children);
    },
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

(jest.spyOn(React, 'useRef') as any).mockImplementation((initial: any) => ({ current: initial }));
(jest.spyOn(React, 'useEffect') as any).mockImplementation((cb: any) => cb && cb());

const mockUseTheme = jest.fn(() => ({
  theme: {
    colors: {
      accent: '#0284C7',
      surfaceRecessed: '#E2E8F0',
      borderLight: '#CBD5E1',
      borderAccent: 'rgba(2, 132, 199, 0.45)',
      white: '#FFFFFF',
      textSecondary: '#334155',
    },
  },
  isDark: false,
  mode: 'light',
}));

jest.mock('../../../theme', () => ({
  __esModule: true,
  default: {},
  useTheme: () => mockUseTheme(),
}));

import { AppSwitch } from '../AppSwitch';

describe('AppSwitch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders switch with default props', () => {
    const onValueChange = jest.fn();
    const element = React.createElement(AppSwitch, {
      value: false,
      onValueChange,
      accessibilityLabel: 'Enable notifications',
    });

    expect(element).toBeDefined();
    expect(element.props.value).toBe(false);
    expect(element.props.accessibilityLabel).toBe('Enable notifications');
  });

  it('calls onValueChange when pressed', () => {
    const onValueChange = jest.fn();
    const rendered = AppSwitch({
      value: false,
      onValueChange,
      accessibilityLabel: 'Toggle item',
    }) as any;

    expect(rendered).toBeDefined();
    expect(typeof rendered.props.onPress).toBe('function');

    rendered.props.onPress();
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not trigger onValueChange when disabled', () => {
    const onValueChange = jest.fn();
    const rendered = AppSwitch({
      value: true,
      onValueChange,
      disabled: true,
      accessibilityLabel: 'Disabled item',
    }) as any;

    expect(rendered).toBeDefined();
    rendered.props.onPress();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('supports size="sm" and custom colors', () => {
    const onValueChange = jest.fn();
    const element = React.createElement(AppSwitch, {
      value: true,
      onValueChange,
      size: 'sm',
      trackActiveColor: '#10B981',
      trackInactiveColor: '#64748B',
      thumbColor: '#FFFFFF',
    });

    expect(element).toBeDefined();
    expect(element.props.size).toBe('sm');
    expect(element.props.trackActiveColor).toBe('#10B981');
    expect(element.props.trackInactiveColor).toBe('#64748B');
    expect(element.props.thumbColor).toBe('#FFFFFF');
  });
});
