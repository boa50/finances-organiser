import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';
import { AppTheme, ThemeContextValue, ThemeMode } from './types';

export const THEME_STORAGE_KEY = 'financecloud_theme_mode';

const defaultContextValue: ThemeContextValue = {
  theme: darkTheme,
  mode: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setMode: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(defaultContextValue);

let inMemoryMode: ThemeMode = 'dark';

export function getStoredThemeMode(): ThemeMode {
  try {
    const storage =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : typeof localStorage !== 'undefined'
          ? localStorage
          : null;

    if (storage) {
      const stored = storage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
  } catch (e) {
    console.warn('Failed to read theme mode from localStorage:', e);
  }
  return inMemoryMode;
}

export function setStoredThemeMode(mode: ThemeMode): void {
  inMemoryMode = mode;
  try {
    const storage =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : typeof localStorage !== 'undefined'
          ? localStorage
          : null;

    if (storage) {
      storage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch (e) {
    console.warn('Failed to save theme mode to localStorage:', e);
  }
}

export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const activeBg = mode === 'dark' ? darkTheme.colors.background : lightTheme.colors.background;
  const activeText = mode === 'dark' ? darkTheme.colors.textPrimary : lightTheme.colors.textPrimary;

  if (document.documentElement) {
    document.documentElement.style.backgroundColor = activeBg;
    document.documentElement.style.colorScheme = mode;
  }
  if (document.body) {
    document.body.style.backgroundColor = activeBg;
    document.body.style.color = activeText;
  }
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.style.backgroundColor = activeBg;
  }

  // Update meta tags for browser status bar and system navigation bar colors
  const setMetaTag = (attrName: string, attrVal: string, content: string) => {
    let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attrName, attrVal);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  setMetaTag('name', 'theme-color', activeBg);
  setMetaTag('name', 'msapplication-TileColor', activeBg);
  setMetaTag(
    'name',
    'apple-mobile-web-app-status-bar-style',
    mode === 'dark' ? 'black-translucent' : 'default'
  );
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialMode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => initialMode || getStoredThemeMode());

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredThemeMode(newMode);
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const activeTheme: AppTheme = mode === 'light' ? lightTheme : darkTheme;
    return {
      theme: activeTheme,
      mode,
      isDark: mode === 'dark',
      toggleTheme,
      setMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context || defaultContextValue;
}
