import { palette } from './palette';
import { fontFamily, fontSize, fontWeight, radii, spacing } from './tokens';
import { AppTheme, ThemeColors, ThemeTypography } from './types';

export const lightColors: ThemeColors = {
  // Backgrounds
  background: palette.slate100,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceGlass: 'rgba(255, 255, 255, 0.95)',
  surfaceRecessed: palette.slate200,
  surfaceSubtle: palette.slate150,
  surfaceMuted: 'rgba(15, 23, 42, 0.04)',
  surfaceHighlight: 'rgba(15, 23, 42, 0.06)',

  // Text
  textPrimary: palette.slate900,
  textSecondary: palette.slate700,
  textTertiary: palette.slate500,
  textLight: palette.slate800,
  textMuted: palette.slate600,

  // Borders
  border: palette.slate200,
  borderLight: palette.slate300,
  borderSubtle: 'rgba(15, 23, 42, 0.08)',
  borderAccent: 'rgba(2, 132, 199, 0.45)',
  borderGlow: 'rgba(2, 132, 199, 0.25)',
  borderStrong: palette.slate400,

  // Accent / Primary
  accent: palette.sky600,
  accentDark: palette.sky700,
  accentMid: palette.sky500,
  accentBg: 'rgba(2, 132, 199, 0.12)',
  accentBgStrong: 'rgba(2, 132, 199, 0.22)',

  // Success
  success: palette.emerald600,
  successLight: palette.emerald500,
  successBg: 'rgba(5, 150, 105, 0.12)',
  successBgStrong: 'rgba(5, 150, 105, 0.22)',

  // Danger
  danger: palette.rose600,
  dangerLight: palette.rose500,
  dangerBg: 'rgba(225, 29, 72, 0.12)',
  dangerBgLight: 'rgba(225, 29, 72, 0.06)',
  dangerBgStrong: 'rgba(225, 29, 72, 0.22)',

  // Warning
  warning: palette.amber600,
  warningLight: palette.amber500,
  warningBg: 'rgba(217, 119, 6, 0.14)',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.65)',

  // Shadows
  cardShadow: '0px 2px 8px rgba(15, 23, 42, 0.08)',
  heroShadow: '0px 4px 16px rgba(15, 23, 42, 0.10)',
  fabShadow: '0px 4px 16px rgba(2, 132, 199, 0.35)',
  navShadow: '0px 4px 20px rgba(15, 23, 42, 0.14)',

  // Base
  white: palette.white,
};

export const lightTypography: ThemeTypography = {
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    color: lightColors.textPrimary,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: lightColors.textPrimary,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    color: lightColors.textPrimary,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: lightColors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: lightColors.textSecondary,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    color: lightColors.textPrimary,
  },
  bodyMedium: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: lightColors.textPrimary,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: lightColors.textSecondary,
  },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  heroValue: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.black,
    color: lightColors.textPrimary,
    letterSpacing: -1.2,
  },
  kpiValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.4,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: lightColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
};

export const lightTheme: AppTheme = {
  mode: 'light',
  isDark: false,
  colors: lightColors,
  spacing,
  radii,
  fontSize,
  fontWeight,
  fontFamily,
  typography: lightTypography,
};
