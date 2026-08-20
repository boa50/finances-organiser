import { palette } from './palette';
import { fontFamily, fontSize, fontWeight, radii, spacing } from './tokens';
import { AppTheme, ThemeColors, ThemeTypography } from './types';

export const darkColors: ThemeColors = {
  // Backgrounds
  background: palette.slate950,
  surface: palette.slate850,
  surfaceElevated: palette.slate800,
  surfaceGlass: 'rgba(17, 25, 40, 0.85)',
  surfaceRecessed: 'rgba(0, 0, 0, 0.35)',
  surfaceSubtle: 'rgba(17, 25, 40, 0.70)',
  surfaceMuted: 'rgba(255, 255, 255, 0.05)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.09)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textLight: '#E2E8F0',
  textMuted: '#CBD5E1',

  // Borders
  border: 'rgba(255, 255, 255, 0.10)',
  borderLight: 'rgba(255, 255, 255, 0.16)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderAccent: 'rgba(56, 189, 248, 0.38)',
  borderGlow: 'rgba(56, 189, 248, 0.25)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',

  // Accent / Primary
  accent: palette.sky400,
  accentDark: palette.sky700,
  accentMid: palette.sky500,
  accentBg: 'rgba(56, 189, 248, 0.14)',
  accentBgStrong: 'rgba(56, 189, 248, 0.25)',

  // Success
  success: palette.emerald400,
  successLight: palette.emerald400,
  successBg: 'rgba(52, 211, 153, 0.14)',
  successBgStrong: 'rgba(52, 211, 153, 0.25)',

  // Danger
  danger: palette.rose400,
  dangerLight: palette.rose400,
  dangerBg: 'rgba(251, 113, 133, 0.14)',
  dangerBgLight: 'rgba(251, 113, 133, 0.08)',
  dangerBgStrong: 'rgba(251, 113, 133, 0.25)',

  // Warning
  warning: palette.amber400,
  warningLight: palette.amber400,
  warningBg: 'rgba(251, 191, 36, 0.14)',

  // Overlay
  overlay: 'rgba(7, 11, 17, 0.88)',

  // Shadows
  cardShadow: '0px 6px 18px rgba(0, 0, 0, 0.40)',
  heroShadow: '0px 10px 28px rgba(0, 0, 0, 0.50)',
  fabShadow: '0px 6px 20px rgba(56, 189, 248, 0.45)',
  navShadow: '0px 10px 36px rgba(0, 0, 0, 0.60)',

  // Base
  white: palette.white,
};

export const darkTypography: ThemeTypography = {
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    color: darkColors.textPrimary,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    color: darkColors.textPrimary,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: darkColors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: darkColors.textSecondary,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    color: darkColors.textPrimary,
  },
  bodyMedium: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: darkColors.textSecondary,
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
    color: darkColors.textPrimary,
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
    color: darkColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  isDark: true,
  colors: darkColors,
  spacing,
  radii,
  fontSize,
  fontWeight,
  fontFamily,
  typography: darkTypography,
};
