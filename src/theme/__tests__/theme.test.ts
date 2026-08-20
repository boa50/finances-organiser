import theme, {
  darkTheme,
  lightTheme,
  palette,
  spacing,
  radii,
  fontSize,
  fontWeight,
  fontFamily,
  getStoredThemeMode,
  setStoredThemeMode,
  THEME_STORAGE_KEY,
} from '../index';

describe('Theme System', () => {
  beforeEach(() => {
    // Clear localStorage mock if defined
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Tokens & Structure', () => {
    it('exports common layout tokens correctly', () => {
      expect(spacing.md).toBe(8);
      expect(spacing['4xl']).toBe(20);
      expect(radii.card).toBe(20);
      expect(radii.modal).toBe(24);
      expect(fontSize.base).toBe(13);
      expect(fontSize['4xl']).toBe(34);
      expect(fontWeight.bold).toBe('700');
      expect(fontFamily.sans).toBe('System');
    });

    it('has identical color token keys in dark and light themes', () => {
      const darkKeys = Object.keys(darkTheme.colors).sort();
      const lightKeys = Object.keys(lightTheme.colors).sort();
      expect(darkKeys).toEqual(lightKeys);
    });

    it('has valid color strings for all tokens in both themes', () => {
      Object.entries(darkTheme.colors).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.entries(lightTheme.colors).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('has dark mode correctly flagged as isDark = true and light mode as isDark = false', () => {
      expect(darkTheme.isDark).toBe(true);
      expect(darkTheme.mode).toBe('dark');
      expect(lightTheme.isDark).toBe(false);
      expect(lightTheme.mode).toBe('light');
    });

    it('re-exports darkTheme as default theme for backward compatibility', () => {
      expect(theme.mode).toBe('dark');
      expect(theme.colors.background).toBe(palette.slate950);
      expect(theme.spacing).toBeDefined();
      expect(theme.typography).toBeDefined();
    });
  });

  describe('Theme Storage & Persistence', () => {
    it('defaults to dark mode when nothing is stored', () => {
      const mode = getStoredThemeMode();
      expect(mode).toBe('dark');
    });

    it('stores and retrieves light mode from localStorage', () => {
      setStoredThemeMode('light');
      expect(getStoredThemeMode()).toBe('light');
    });

    it('stores and retrieves dark mode from localStorage', () => {
      setStoredThemeMode('dark');
      expect(getStoredThemeMode()).toBe('dark');
    });
  });

  describe('Light Theme Aesthetics', () => {
    it('uses light canvas and dark text for high-contrast accessibility', () => {
      expect(lightTheme.colors.background).toBe(palette.slate100);
      expect(lightTheme.colors.textPrimary).toBe(palette.slate900);
      expect(lightTheme.colors.textSecondary).toBe(palette.slate700);
      expect(lightTheme.colors.textTertiary).toBe(palette.slate600);
      expect(lightTheme.colors.surface).toBe(palette.white);
      expect(lightTheme.colors.accent).toBe(palette.sky600);
    });
  });

  describe('Dark Theme Aesthetics', () => {
    it('uses dark canvas and light text', () => {
      expect(darkTheme.colors.background).toBe(palette.slate950);
      expect(darkTheme.colors.textPrimary).toBe(palette.slate50);
      expect(darkTheme.colors.surface).toBe(palette.slate850);
      expect(darkTheme.colors.accent).toBe(palette.sky400);
    });
  });
});
