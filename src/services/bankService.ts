import { BankItem } from '../types';
import { tursoService } from './tursoService';
import { subscriptionService } from './subscriptionService';
import { generateId } from '../utils/idGenerator';
import { isJsonResponse } from './apiClient';

const BANKS_STORAGE_KEY = 'finances_custom_banks';

import { DEFAULT_BANKS } from '../constants/defaults';
export { DEFAULT_BANKS };

class BankService {
  private banks: BankItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): BankItem[] {
    if (typeof window === 'undefined') {
      this.banks = [];
      return this.banks;
    }

    try {
      const stored = localStorage.getItem(BANKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.banks = parsed;
          return this.banks;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored banks:', e);
    }

    this.banks = [];
    this.saveToLocalStorage();
    return this.banks;
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BANKS_STORAGE_KEY, JSON.stringify(this.banks));
    } catch (e) {
      console.warn('Failed to save banks to localStorage:', e);
    }
  }

  public async getBanks(): Promise<BankItem[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const items: BankItem[] = await res.json();
          this.banks = items;
          this.saveToLocalStorage();
          return [...this.banks];
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM banks ORDER BY name ASC');
        if (res.rows) {
          const dbItems: BankItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
          }));
          this.banks = dbItems;
          this.saveToLocalStorage();
          return [...this.banks];
        }
      } catch (e) {
        console.warn('Could not fetch banks from Turso DB, using local cache:', e);
      }
    }

    return [...this.banks];
  }

  public getBanksSync(): BankItem[] {
    return [...this.banks];
  }

  public async addBank(name: string): Promise<BankItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Bank name cannot be empty.');
    }

    const current = await this.getBanks();
    if (current.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A bank named "${trimmed}" already exists.`);
    }

    const newBank: BankItem = {
      id: generateId('bank'),
      name: trimmed,
    };

    this.banks = [...this.banks, newBank];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ name: trimmed }),
        });
        if (isJsonResponse(res)) {
          const created: BankItem = await res.json();
          return created;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'INSERT INTO banks (id, name) VALUES (?, ?)',
          args: [newBank.id, newBank.name],
        });
      } catch (err) {
        console.error('Failed to sync added bank to Turso DB:', err);
      }
    }

    return newBank;
  }

  public async updateBank(id: string, name: string): Promise<BankItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Bank name cannot be empty.');
    }

    const current = await this.getBanks();
    if (current.some((b) => b.id !== id && b.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A bank named "${trimmed}" already exists.`);
    }

    const index = this.banks.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error('Bank not found.');
    }

    const updated: BankItem = {
      ...this.banks[index],
      name: trimmed,
    };

    this.banks[index] = updated;
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, name: trimmed }),
        });
        if (isJsonResponse(res)) {
          const updatedBank: BankItem = await res.json();
          return updatedBank;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'UPDATE banks SET name = ? WHERE id = ?',
          args: [trimmed, id],
        });
      } catch (err) {
        console.error('Failed to sync bank update to Turso DB:', err);
      }
    }

    return updated;
  }

  public async deleteBank(id: string): Promise<boolean> {
    const target = this.banks.find((b) => b.id === id);
    const bankName = target?.name;

    this.banks = this.banks.filter((b) => b.id !== id);
    this.saveToLocalStorage();

    tursoService.removeBankReferences(id);
    subscriptionService.removeBankReferences(id);

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/banks?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          return true;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'UPDATE transactions SET bank_id = NULL WHERE bank_id = ?',
          args: [id],
        });
        await client.execute({
          sql: 'UPDATE subscriptions SET bank_id = NULL WHERE bank_id = ?',
          args: [id],
        });
        await client.execute({
          sql: 'DELETE FROM banks WHERE id = ?',
          args: [id],
        });
      } catch (err) {
        console.error('Failed to delete bank from Turso DB:', err);
      }
    }

    return true;
  }

  public async resetToDefaults(): Promise<BankItem[]> {
    this.banks = [];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/banks?action=reset', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
        });
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute('DELETE FROM banks');
      } catch (err) {
        console.error('Failed to reset banks in Turso DB:', err);
      }
    }

    return [];
  }
}

export const bankService = new BankService();
