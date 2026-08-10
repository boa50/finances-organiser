import {
  convertCurrency,
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrencyInfo,
} from '../currencies';

describe('Currency Utilities', () => {
  describe('getCurrencyInfo', () => {
    it('should return currency info for known code', () => {
      const info = getCurrencyInfo('BRL');
      expect(info.code).toBe('BRL');
      expect(info.symbol).toBe('R$');
      expect(info.name).toBe('Brazilian Real');
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
  });

  describe('CURRENCIES constant', () => {
    it('should contain default currency BRL', () => {
      const hasDefault = CURRENCIES.some((c) => c.code === DEFAULT_CURRENCY);
      expect(hasDefault).toBe(true);
    });
  });
});
