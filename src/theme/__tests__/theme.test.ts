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

  describe('ThemeProvider Meta Tag & DOM Sync', () => {
    const originalDocument = (global as any).document;

    afterEach(() => {
      if (originalDocument) {
        (global as any).document = originalDocument;
      } else {
        delete (global as any).document;
      }
    });

    it('syncs theme-color, msapplication-TileColor and apple status bar meta tags for dark and light modes', () => {
      const metaTags: Record<string, string> = {};
      const docStyle: Record<string, any> = {};
      const bodyStyle: Record<string, any> = {};
      const rootStyle: Record<string, any> = {};

      const mockDoc: any = {
        documentElement: { style: docStyle },
        body: { style: bodyStyle },
        head: {
          appendChild: (node: any) => {
            const name = node.getAttribute('name');
            const content = node.getAttribute('content');
            if (name) metaTags[name] = content;
          },
        },
        getElementById: (id: string) => (id === 'root' ? { style: rootStyle } : null),
        querySelector: (selector: string) => {
          const match = selector.match(/name="([^"]+)"/);
          if (match && metaTags[match[1]] !== undefined) {
            const name = match[1];
            return {
              setAttribute: (k: string, v: string) => {
                if (k === 'content') metaTags[name] = v;
              },
              getAttribute: (k: string) => (k === 'content' ? metaTags[name] : null),
            };
          }
          return null;
        },
        createElement: (tag: string) => {
          const attrs: Record<string, string> = {};
          return {
            setAttribute: (k: string, v: string) => {
              attrs[k] = v;
              if (attrs.name && attrs.content) {
                metaTags[attrs.name] = attrs.content;
              }
            },
            getAttribute: (k: string) => attrs[k] || null,
          };
        },
      };

      (global as any).document = mockDoc;

      const { applyThemeToDocument } = require('../ThemeContext');

      // 1. Test dark mode sync
      applyThemeToDocument('dark');
      expect(metaTags['theme-color']).toBe(darkTheme.colors.background);
      expect(metaTags['msapplication-TileColor']).toBe(darkTheme.colors.background);
      expect(metaTags['apple-mobile-web-app-status-bar-style']).toBe('black-translucent');
      expect(docStyle.backgroundColor).toBe(darkTheme.colors.background);
      expect(docStyle.colorScheme).toBe('dark');
      expect(bodyStyle.backgroundColor).toBe(darkTheme.colors.background);
      expect(rootStyle.backgroundColor).toBe(darkTheme.colors.background);

      // 2. Test light mode sync
      applyThemeToDocument('light');
      expect(metaTags['theme-color']).toBe(lightTheme.colors.background);
      expect(metaTags['msapplication-TileColor']).toBe(lightTheme.colors.background);
      expect(metaTags['apple-mobile-web-app-status-bar-style']).toBe('default');
      expect(docStyle.backgroundColor).toBe(lightTheme.colors.background);
      expect(docStyle.colorScheme).toBe('light');
      expect(bodyStyle.backgroundColor).toBe(lightTheme.colors.background);
      expect(rootStyle.backgroundColor).toBe(lightTheme.colors.background);
    });
  });
});
