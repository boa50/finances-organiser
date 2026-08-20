import React from 'react';

const mockToggleTheme = jest.fn();
const mockUseTheme = jest.fn(() => ({
  theme: {
    colors: {
      background: '#090d16',
      surfaceElevated: '#0f172a',
      surfaceRecessed: '#0b1120',
      borderLight: '#1e293b',
      borderAccent: '#0284c7',
      cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      accent: '#38bdf8',
      accentBg: 'rgba(56, 189, 248, 0.1)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textTertiary: '#64748b',
      white: '#ffffff',
      danger: '#ef4444',
    },
    spacing: {
      xs: 4,
      sm: 6,
      md: 8,
      lg: 10,
      xl: 12,
      '2xl': 14,
      '3xl': 16,
      '4xl': 20,
      '5xl': 24,
      '6xl': 28,
    },
    radii: {
      pill: 9999,
      modal: 24,
    },
    fontSize: {
      sm: 12,
      '3xl': 28,
    },
    fontWeight: {
      extrabold: '800',
      bold: '700',
    },
  },
  isDark: true,
  mode: 'dark' as const,
  toggleTheme: mockToggleTheme,
  setMode: jest.fn(),
}));

let hookState: any[] = [];
let hookIndex = 0;

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

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web' },
    Pressable: (props: any) => {
      const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
      return React.createElement('button', { ...props, style, onClick: props.onPress }, props.children);
    },
    SafeAreaView: (props: any) => React.createElement('div', { 'data-testid': 'safe-area', ...props }, props.children),
    StatusBar: () => null,
    KeyboardAvoidingView: (props: any) => React.createElement('div', { 'data-testid': 'keyboard-avoiding', ...props }, props.children),
    View: (props: any) => React.createElement('div', props, props.children),
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

jest.mock('../../theme', () => {
  const actual = jest.requireActual('../../theme');
  return {
    __esModule: true,
    default: actual.default,
    useTheme: () => mockUseTheme(),
  };
});

const mockToggleAppLanguage = jest.fn();
jest.mock('../../i18n', () => ({
  toggleAppLanguage: () => mockToggleAppLanguage(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt-BR' },
  }),
}));

jest.mock('lucide-react-native', () => ({
  Globe: (props: any) => React.createElement('span', { 'data-icon': 'globe', ...props }),
  Lock: (props: any) => React.createElement('span', { 'data-icon': 'lock', ...props }),
  LogIn: (props: any) => React.createElement('span', { 'data-icon': 'login', ...props }),
  Moon: (props: any) => React.createElement('span', { 'data-icon': 'moon', ...props }),
  Sun: (props: any) => React.createElement('span', { 'data-icon': 'sun', ...props }),
  Wallet: (props: any) => React.createElement('span', { 'data-icon': 'wallet', ...props }),
}));

const mockLogin = jest.fn();
jest.mock('../../services/authService', () => ({
  authService: {
    login: (pwd: string) => mockLogin(pwd),
  },
}));

jest.mock('../../components/ui', () => {
  const React = require('react');
  return {
    AppButton: (props: any) =>
      React.createElement(
        'button',
        {
          'data-testid': 'app-button',
          onClick: props.onPress,
          disabled: props.disabled,
        },
        props.title
      ),
    AppText: (props: any) => React.createElement('span', props, props.children),
    AppTextInput: (props: any) =>
      React.createElement('input', {
        'data-testid': 'app-text-input',
        value: props.value,
        onChange: (e: any) => props.onChangeText(e.target.value),
        placeholder: props.placeholder,
      }),
    FeedbackMessage: (props: any) =>
      props.visible ? React.createElement('div', { 'data-testid': 'feedback' }, props.message) : null,
  };
});

import { LoginScreen } from '../LoginScreen';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hookState = [];
    hookIndex = 0;
  });

  it('renders LoginScreen component without errors', () => {
    const onAuthenticated = jest.fn();
    const element = React.createElement(LoginScreen, { onAuthenticated });
    expect(element).toBeDefined();
  });

  it('provides a theme toggle button that triggers toggleTheme when pressed', () => {
    const onAuthenticated = jest.fn();
    const tree = LoginScreen({ onAuthenticated }) as any;
    expect(tree).toBeDefined();

    // Top control bar is the second child in safe area (after StatusBar)
    const topControlBar = tree.props.children[1];
    expect(topControlBar).toBeDefined();

    // Theme toggle button is the first Pressable in topControlBar
    const themeBtn = topControlBar.props.children[0];
    expect(themeBtn).toBeDefined();
    expect(typeof themeBtn.props.onPress).toBe('function');

    // Trigger toggleTheme
    themeBtn.props.onPress();
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('provides a language toggle button that triggers toggleAppLanguage when pressed', () => {
    const onAuthenticated = jest.fn();
    const tree = LoginScreen({ onAuthenticated }) as any;
    expect(tree).toBeDefined();

    const topControlBar = tree.props.children[1];
    const langBtn = topControlBar.props.children[1];
    expect(langBtn).toBeDefined();
    expect(typeof langBtn.props.onPress).toBe('function');

    // Trigger language toggle
    langBtn.props.onPress();
    expect(mockToggleAppLanguage).toHaveBeenCalledTimes(1);
  });

  it('handles empty password submission and sets error message', async () => {
    const onAuthenticated = jest.fn();
    const tree = LoginScreen({ onAuthenticated }) as any;
    const keyboardContainer = tree.props.children[2];
    const cardContainer = keyboardContainer.props.children;
    const form = cardContainer.props.children[1];
    const button = form.props.children[2];

    expect(button.props.disabled).toBe(true);
    await button.props.onPress();

    expect(mockLogin).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('handles successful password authentication', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    const onAuthenticated = jest.fn();
    const tree = LoginScreen({ onAuthenticated }) as any;
    const keyboardContainer = tree.props.children[2];
    const cardContainer = keyboardContainer.props.children;
    const form = cardContainer.props.children[1];
    const textInput = form.props.children[0];

    // Enter password
    textInput.props.onChangeText('secret123');

    // Re-render component with updated hookState
    hookIndex = 0;
    const updatedTree = LoginScreen({ onAuthenticated }) as any;
    const updatedForm = updatedTree.props.children[2].props.children.props.children[1];
    const submitButton = updatedForm.props.children[2];

    // Submit form
    await submitButton.props.onPress();

    expect(mockLogin).toHaveBeenCalledWith('secret123');
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('handles failed password authentication', async () => {
    mockLogin.mockResolvedValueOnce({ success: false, message: 'Invalid password' });
    const onAuthenticated = jest.fn();
    const tree = LoginScreen({ onAuthenticated }) as any;
    const keyboardContainer = tree.props.children[2];
    const cardContainer = keyboardContainer.props.children;
    const form = cardContainer.props.children[1];
    const textInput = form.props.children[0];

    // Enter wrong password
    textInput.props.onChangeText('wrong_pwd');

    // Re-render component with updated hookState
    hookIndex = 0;
    const updatedTree = LoginScreen({ onAuthenticated }) as any;
    const updatedForm = updatedTree.props.children[2].props.children.props.children[1];
    const submitButton = updatedForm.props.children[2];

    // Submit form
    await submitButton.props.onPress();

    expect(mockLogin).toHaveBeenCalledWith('wrong_pwd');
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
