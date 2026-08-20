import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';

export * from './types';
export * from './palette';
export * from './tokens';
export * from './darkTheme';
export * from './lightTheme';
export * from './ThemeContext';

// Default static values based on dark theme for backward compatibility
export const colors = darkTheme.colors;
export const typography = darkTheme.typography;

export const theme = darkTheme;
export default darkTheme;
