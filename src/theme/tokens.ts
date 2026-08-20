import {
  ThemeFontFamily,
  ThemeFontSize,
  ThemeFontWeight,
  ThemeRadii,
  ThemeSpacing,
} from './types';

export const spacing: ThemeSpacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 6px */
  sm: 6,
  /** 8px */
  md: 8,
  /** 10px */
  base: 10,
  /** 12px */
  lg: 12,
  /** 14px */
  xl: 14,
  /** 16px */
  '2xl': 16,
  /** 18px */
  '3xl': 18,
  /** 20px */
  '4xl': 20,
  /** 22px */
  '5xl': 22,
  /** 24px */
  '6xl': 24,
  /** 32px */
  '6.5xl': 32,
  /** 40px */
  '7xl': 40,
} as const;

export const radii: ThemeRadii = {
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 18,
  '4xl': 20,
  card: 20,
  modal: 24,
  button: 14,
  input: 14,
  pill: 999,
} as const;

export const fontSize: ThemeFontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 24,
  '4xl': 34,
  '5xl': 40,
} as const;

export const fontWeight: ThemeFontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const fontFamily: ThemeFontFamily = {
  sans: 'System',
  mono: 'monospace',
} as const;
