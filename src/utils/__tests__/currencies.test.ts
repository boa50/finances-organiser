import {
  convertCurrency,
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrencyInfo,
  getCurrencyName,
  refreshCurrencyRates,
} from '../currencies';

describe('Currency Utilities', () => {
  describe('getCurrencyInfo', () => {
    it('should return currency info for known code', () => {
      const info = getCurrencyInfo('BRL');
      expect(info.code).toBe('BRL');
      expect(info.symbol).toBe('R$');
      expect(info.name).toBe('Brazilian Real');
    });

    it('should return currency info for AUD (Australian Dollar)', () => {
      const info = getCurrencyInfo('AUD');
      expect(info.code).toBe('AUD');
      expect(info.symbol).toBe('A$');
      expect(info.name).toBe('Australian Dollar');
      expect(info.flag).toBe('🇦🇺');
    });

    it('should handle case insensitivity', () => {
      const info = getCurrencyInfo('usd');
      expect(info.code).toBe('USD');
      expect(info.symbol).toBe('$');
    });

    it('should return fallback for unknown currency code', () => {
      const info = getCurrencyInfo('XYZ');
      expect(info.code).toBe('XYZ');
      expect(info.symbol).toBe('$');
    });
  });

  describe('getCurrencyName', () => {
    it('should return default name when no translation function provided', () => {
      expect(getCurrencyName('BRL')).toBe('Brazilian Real');
      expect(getCurrencyName('USD')).toBe('US Dollar');
      expect(getCurrencyName('EUR')).toBe('Euro');
    });

    it('should use translation function if available', () => {
      const mockT = jest.fn((key: string) => {
        if (key === 'currencies.BRL') return 'Real Brasileiro';
        if (key === 'currencies.USD') return 'Dólar Americano';
        return key;
      });

      expect(getCurrencyName('BRL', mockT)).toBe('Real Brasileiro');
      expect(getCurrencyName('USD', mockT)).toBe('Dólar Americano');
      expect(getCurrencyName('CAD', mockT)).toBe('Canadian Dollar'); // fallback since mock returned key
    });
  });

  describe('formatMoney', () => {
    it('should format positive amounts with default currency (BRL)', () => {
      const formatted = formatMoney(1250.5, 'BRL');
      expect(formatted).toContain('R$');
      expect(formatted).toContain('1');
      expect(formatted).toContain('250');
    });

    it('should format negative amounts with minus sign', () => {
      const formatted = formatMoney(-450, 'USD');
      expect(formatted).toContain('-');
      expect(formatted).toContain('$');
    });

    it('should format zero amount correctly', () => {
      const formatted = formatMoney(0, 'EUR');
      expect(formatted).toContain('€');
      expect(formatted).toContain('0');
    });

    it('should format AUD amounts with A$ symbol', () => {
      const formatted = formatMoney(250.75, 'AUD');
      expect(formatted).toContain('A$');
      expect(formatted).toContain('250');
      expect(formatted).toContain('75');
    });
  });

  describe('convertCurrency', () => {
    it('should return exact amount when converting to same currency', () => {
      const result = convertCurrency(100, 'BRL', 'BRL');
      expect(result).toBe(100);
    });

    it('should fallback to original amount if exchange rate is missing', () => {
      const result = convertCurrency(100, 'UNSUPPORTED_CURRENCY', 'BRL');
      expect(result).toBe(100);
    });

    it('should convert AUD to BRL when exchange rate is loaded', async () => {
      const mockQuotes = {
        AUDBRL: {
          code: 'AUD',
          codein: 'BRL',
          bid: '3.65',
        },
      };

      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuotes),
        })
      ) as any;

      await refreshCurrencyRates(true);

      const converted = convertCurrency(100, 'AUD', 'BRL');
      expect(converted).toBeCloseTo(365, 1);
    });
  });

  describe('CURRENCIES constant', () => {
    it('should contain default currency BRL', () => {
      const hasDefault = CURRENCIES.some((c) => c.code === DEFAULT_CURRENCY);
      expect(hasDefault).toBe(true);
    });

    it('should contain AUD in VALID_CURRENCIES', () => {
      const hasAud = CURRENCIES.some((c) => c.code === 'AUD');
      expect(hasAud).toBe(true);
    });
  });
});
