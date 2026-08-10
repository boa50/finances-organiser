/**
 * Centralized app theme — single source of truth for colours, spacing, radii,
 * and standardized typography across every screen and component.
 */

// ─── Base palette ────────────────────────────────────────────────────────────

export const palette = {
  /** Slate-900 – deepest background */
  slate900: '#0F172A',
  /** Slate-800 – card / surface background */
  slate800: '#1E293B',

  /** Text hierarchy */
  slate50: '#F8FAFC',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',

  /** Accent / primary */
  sky400: '#38BDF8',
  sky700: '#0369A1',
  sky600: '#0284C7',

  /** Semantic status */
  emerald500: '#10B981',
  rose500: '#F43F5E',
  amber500: '#F59E0B',

  white: '#FFFFFF',
} as const;

// ─── Semantic colour tokens ──────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background: palette.slate900,
  surface: palette.slate800,
  surfaceSubtle: `rgba(15, 23, 42, 0.6)`,

  // Text
  textPrimary: palette.slate50,
  textSecondary: palette.slate400,
  textTertiary: palette.slate500,
  textLight: palette.slate200,
  textMuted: palette.slate300,

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderAccent: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  surfaceMuted: 'rgba(255, 255, 255, 0.06)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.08)',

  // Accent / primary
  accent: palette.sky400,
  accentDark: palette.sky700,
  accentMid: palette.sky600,
  accentBg: 'rgba(56, 189, 248, 0.15)',
  accentBgStrong: 'rgba(56, 189, 248, 0.2)',

  // Success (income)
  success: palette.emerald500,
  successBg: 'rgba(16, 185, 129, 0.15)',

  // Danger (expense)
  danger: palette.rose500,
  dangerBg: 'rgba(244, 63, 94, 0.15)',
  dangerBgLight: 'rgba(244, 63, 94, 0.12)',

  // Warning
  warning: palette.amber500,
  warningBg: 'rgba(245, 158, 11, 0.15)',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.85)',

  white: palette.white,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
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
  /** 40px */
  '7xl': 40,
} as const;

// ─── Border radii ────────────────────────────────────────────────────────────

export const radii = {
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 18,
  '4xl': 20,
} as const;

// ─── Typography Tokens ───────────────────────────────────────────────────────

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 24,
  '4xl': 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const fontFamily = {
  sans: 'System',
  mono: 'monospace',
} as const;

export const typography = {
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
  },
  bodyMedium: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
} as const;

// ─── Convenience re-export ───────────────────────────────────────────────────

const theme = {
  palette,
  colors,
  spacing,
  radii,
  fontSize,
  fontWeight,
  fontFamily,
  typography,
} as const;

export default theme;
