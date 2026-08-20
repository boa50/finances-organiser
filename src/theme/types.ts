export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  surfaceRecessed: string;
  surfaceSubtle: string;
  surfaceMuted: string;
  surfaceHighlight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textLight: string;
  textMuted: string;

  // Borders
  border: string;
  borderLight: string;
  borderSubtle: string;
  borderAccent: string;
  borderGlow: string;
  borderStrong: string;

  // Accent / Primary
  accent: string;
  accentDark: string;
  accentMid: string;
  accentBg: string;
  accentBgStrong: string;

  // Success
  success: string;
  successLight: string;
  successBg: string;
  successBgStrong: string;

  // Danger
  danger: string;
  dangerLight: string;
  dangerBg: string;
  dangerBgLight: string;
  dangerBgStrong: string;

  // Warning
  warning: string;
  warningLight: string;
  warningBg: string;

  // Overlay
  overlay: string;

  // Shadows
  cardShadow: string;
  heroShadow: string;
  fabShadow: string;
  navShadow: string;

  // Base
  white: string;
}

export interface ThemeSpacing {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
  '6xl': number;
  '6.5xl': number;
  '7xl': number;
}

export interface ThemeRadii {
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  card: number;
  modal: number;
  button: number;
  input: number;
  pill: number;
}

export interface ThemeFontSize {
  xs: number;
  sm: number;
  base: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
}

export interface ThemeFontWeight {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
  extrabold: '800';
  black: '900';
}

export interface ThemeFontFamily {
  sans: string;
  mono: string;
}

export interface TypographyStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';
  color?: string;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

export interface ThemeTypography {
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  subtitle: TypographyStyle;
  body: TypographyStyle;
  bodyMedium: TypographyStyle;
  caption: TypographyStyle;
  badge: TypographyStyle;
  button: TypographyStyle;
  heroValue: TypographyStyle;
  kpiValue: TypographyStyle;
  metaLabel: TypographyStyle;
}

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
  fontSize: ThemeFontSize;
  fontWeight: ThemeFontWeight;
  fontFamily: ThemeFontFamily;
  typography: ThemeTypography;
}

export interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}
