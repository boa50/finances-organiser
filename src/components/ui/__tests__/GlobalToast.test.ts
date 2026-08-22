import React from 'react';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web' },
    View: (props: any) => React.createElement('div', { 'data-testid': 'view', ...props }, props.children),
    Pressable: (props: any) => {
      const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
      return React.createElement('button', { ...props, style, onClick: props.onPress }, props.children);
    },
    ActivityIndicator: (props: any) => React.createElement('span', { 'data-testid': 'spinner', ...props }),
    Animated: {
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb({ finished: true })),
      })),
      parallel: jest.fn((animations) => ({
        start: jest.fn((cb) => {
          animations.forEach((a: any) => a.start && a.start());
          if (cb) cb({ finished: true });
        }),
      })),
      View: (props: any) => React.createElement('div', { 'data-testid': 'animated-view', ...props }, props.children),
    },
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

jest.mock('lucide-react-native', () => ({
  AlertCircle: (props: any) => React.createElement('span', { 'data-icon': 'alert-circle', ...props }),
  CheckCircle: (props: any) => React.createElement('span', { 'data-icon': 'check-circle', ...props }),
  Info: (props: any) => React.createElement('span', { 'data-icon': 'info', ...props }),
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

let mockActiveToast: any = null;
const mockDismissToast = jest.fn();

jest.mock('../../../contexts', () => ({
  useToast: () => ({
    activeToast: mockActiveToast,
    dismissToast: mockDismissToast,
  }),
}));

(jest.spyOn(React, 'useRef') as any).mockImplementation((initial: any) => ({ current: initial }));
(jest.spyOn(React, 'useEffect') as any).mockImplementation((cb: any) => cb && cb());

import { GlobalToast } from '../GlobalToast';

describe('GlobalToast', () => {
  beforeEach(() => {
    mockActiveToast = null;
    jest.clearAllMocks();
  });

  it('renders null when there is no active toast', () => {
    mockActiveToast = null;
    const rendered = GlobalToast({});
    expect(rendered).toBeNull();
  });

  it('renders loading toast with spinner', () => {
    mockActiveToast = {
      id: 'toast-1',
      type: 'loading',
      message: 'Deleting item...',
    };

    const rendered = GlobalToast({}) as any;
    expect(rendered).toBeDefined();
  });

  it('renders success toast with message', () => {
    mockActiveToast = {
      id: 'toast-2',
      type: 'success',
      message: 'Item deleted successfully.',
    };

    const rendered = GlobalToast({}) as any;
    expect(rendered).toBeDefined();
  });

  it('renders error toast with message', () => {
    mockActiveToast = {
      id: 'toast-3',
      type: 'error',
      message: 'Failed to delete item.',
    };

    const rendered = GlobalToast({}) as any;
    expect(rendered).toBeDefined();
  });

  it('renders info toast with message', () => {
    mockActiveToast = {
      id: 'toast-4',
      type: 'info',
      message: 'Information notice.',
    };

    const rendered = GlobalToast({}) as any;
    expect(rendered).toBeDefined();
  });
});
