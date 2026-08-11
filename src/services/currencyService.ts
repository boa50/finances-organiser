import { CurrencyInfo } from '../types';
import { VALID_CURRENCIES, getCurrencyInfo } from '../utils/currencies';
import { tursoService } from './tursoService';
import { isJsonResponse } from './apiClient';

const CURRENCIES_STORAGE_KEY = 'finances_custom_currencies';

export const DEFAULT_ENABLED_CURRENCIES: CurrencyInfo[] = [
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
];

class CurrencyService {
  private currencies: CurrencyInfo[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): CurrencyInfo[] {
    if (typeof window === 'undefined') {
      this.currencies = [...DEFAULT_ENABLED_CURRENCIES];
      return this.currencies;
    }

    try {
      const stored = localStorage.getItem(CURRENCIES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.currencies = parsed;
          return this.currencies;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored currencies:', e);
    }

    this.currencies = [...DEFAULT_ENABLED_CURRENCIES];
    this.saveToLocalStorage();
    return this.currencies;
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CURRENCIES_STORAGE_KEY, JSON.stringify(this.currencies));
    } catch (e) {
      console.warn('Failed to save currencies to localStorage:', e);
    }
  }

  public async getCurrencies(): Promise<CurrencyInfo[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/currencies', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const items: CurrencyInfo[] = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            this.currencies = items;
            this.saveToLocalStorage();
            return [...this.currencies];
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM currencies ORDER BY display_order ASC');
        if (res.rows && res.rows.length > 0) {
          const dbItems: CurrencyInfo[] = res.rows.map((row: any) => ({
            code: String(row.id),
            symbol: String(row.symbol),
            name: String(row.name),
            flag: String(row.flag),
          }));
          this.currencies = dbItems;
          this.saveToLocalStorage();
          return [...this.currencies];
        }
      } catch (e) {
        console.warn('Could not fetch currencies from Turso DB, using local cache:', e);
      }
    }

    return [...this.currencies];
  }

  public getCurrenciesSync(): CurrencyInfo[] {
    if (!this.currencies || this.currencies.length === 0) {
      return [...DEFAULT_ENABLED_CURRENCIES];
    }
    return [...this.currencies];
  }

  public async addCurrency(code: string): Promise<CurrencyInfo> {
    let normalizedCode = (code || '').trim().toUpperCase();
    if (normalizedCode === 'WON') normalizedCode = 'KRW';
    if (normalizedCode === 'COL') normalizedCode = 'COP';

    const info = getCurrencyInfo(normalizedCode);
    const validMatch = VALID_CURRENCIES.find((c) => c.code === info.code);
    if (!validMatch) {
      throw new Error(`"${code}" is not a valid currency.`);
    }

    const current = await this.getCurrencies();
    if (current.some((c) => c.code.toUpperCase() === info.code)) {
      throw new Error(`Currency "${info.code}" is already enabled.`);
    }

    const newCurrency: CurrencyInfo = { ...info };

    this.currencies = [...this.currencies, newCurrency];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/currencies', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ code: info.code }),
        });
        if (!res.ok) {
          if (isJsonResponse(res)) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to add currency.');
          }
          throw new Error(`API returned HTTP ${res.status}`);
        }
        if (isJsonResponse(res)) {
          const created: CurrencyInfo = await res.json();
          return created;
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        // Re-throw validation errors from server
        throw e;
      }
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'INSERT INTO currencies (id, symbol, name, flag, display_order) VALUES (?, ?, ?, ?, ?)',
          args: [info.code, info.symbol, info.name, info.flag, this.currencies.length - 1],
        });
      } catch (err) {
        console.error('Failed to sync added currency to Turso DB:', err);
      }
    }

    return newCurrency;
  }

  public async removeCurrency(code: string): Promise<boolean> {
    let normalizedCode = (code || '').trim().toUpperCase();
    if (normalizedCode === 'WON') normalizedCode = 'KRW';
    if (normalizedCode === 'COL') normalizedCode = 'COP';

    const current = await this.getCurrencies();
    if (current.length <= 1) {
      throw new Error('At least one currency must remain enabled.');
    }

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/currencies?id=${encodeURIComponent(normalizedCode)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (!res.ok) {
          if (isJsonResponse(res)) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to delete currency.');
          }
          throw new Error(`API returned HTTP ${res.status}`);
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
    }

    this.currencies = this.currencies.filter((c) => c.code.toUpperCase() !== normalizedCode);
    this.saveToLocalStorage();

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'DELETE FROM currencies WHERE id = ?',
          args: [normalizedCode],
        });
      } catch (err) {
        console.error('Failed to delete currency from Turso DB:', err);
      }
    }

    return true;
  }
}

export const currencyService = new CurrencyService();
