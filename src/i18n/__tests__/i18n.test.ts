import enAU from '../locales/en-AU.json';
import ptBR from '../locales/pt-BR.json';
import i18n, {
  getStoredLanguage,
  setStoredLanguage,
  changeAppLanguage,
  toggleAppLanguage,
  SUPPORTED_LANGUAGES,
} from '../index';

describe('i18n configuration and locale parity', () => {
  function getKeys(obj: any, prefix = ''): string[] {
    return Object.keys(obj).reduce((res: string[], el: string) => {
      const name = prefix ? `${prefix}.${el}` : el;
      if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
        res.push(...getKeys(obj[el], name));
      } else {
        res.push(name);
      }
      return res;
    }, []);
  }

  it('should have identical translation key structures between en-AU and pt-BR', () => {
    const enKeys = getKeys(enAU).sort();
    const ptKeys = getKeys(ptBR).sort();

    expect(enKeys).toEqual(ptKeys);
  });

  it('should have all supported languages configured', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en-AU');
    expect(codes).toContain('pt-BR');
  });

  it('should get and set stored language in localStorage', () => {
    setStoredLanguage('pt-BR');
    expect(getStoredLanguage()).toBe('pt-BR');

    setStoredLanguage('en-AU');
    expect(getStoredLanguage()).toBe('en-AU');
  });

  it('should toggle between en-AU and pt-BR', async () => {
    await changeAppLanguage('en-AU');
    expect(i18n.language).toBe('en-AU');

    const nextLang = await toggleAppLanguage();
    expect(nextLang).toBe('pt-BR');
    expect(i18n.language).toBe('pt-BR');

    const toggledAgain = await toggleAppLanguage();
    expect(toggledAgain).toBe('en-AU');
    expect(i18n.language).toBe('en-AU');
  });

  it('should correctly translate sample keys in both languages', async () => {
    await changeAppLanguage('en-AU');
    expect(i18n.t('common.income')).toBe('Income');
    expect(i18n.t('common.expense')).toBe('Expense');
    expect(i18n.t('tabs.overview')).toBe('Overview');
    expect(i18n.t('currencies.BRL')).toBe('Brazilian Real');
    expect(i18n.t('currencies.USD')).toBe('US Dollar');

    await changeAppLanguage('pt-BR');
    expect(i18n.t('common.income')).toBe('Receita');
    expect(i18n.t('common.expense')).toBe('Despesa');
    expect(i18n.t('tabs.overview')).toBe('Visão Geral');
    expect(i18n.t('currencies.BRL')).toBe('Real Brasileiro');
    expect(i18n.t('currencies.USD')).toBe('Dólar Americano');
  });

  it('should have translation definitions for all t() keys used across the codebase', () => {
    const fs = require('fs');
    const path = require('path');

    function getFiles(dir: string): string[] {
      const files: string[] = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          if (item.name !== '__tests__' && item.name !== 'node_modules') {
            files.push(...getFiles(fullPath));
          }
        } else if (/\.(tsx|ts)$/.test(item.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const srcDir = path.resolve(__dirname, '../../');
    const rootDir = path.resolve(__dirname, '../../../');
    const codeFiles = [...getFiles(srcDir), path.join(rootDir, 'App.tsx')].filter(fs.existsSync);

    const usedKeys = new Set<string>();
    const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
    }

    const enKeySet = new Set(getKeys(enAU));
    const ptKeySet = new Set(getKeys(ptBR));

    const missingInEn: string[] = [];
    const missingInPt: string[] = [];

    for (const key of usedKeys) {
      if (!enKeySet.has(key)) {
        missingInEn.push(key);
      }
      if (!ptKeySet.has(key)) {
        missingInPt.push(key);
      }
    }

    expect(missingInEn).toEqual([]);
    expect(missingInPt).toEqual([]);
  });
});
