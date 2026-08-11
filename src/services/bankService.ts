import { BankItem } from '../types';
import { tursoService } from './tursoService';
import { generateId } from '../utils/idGenerator';

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
      this.banks = [...DEFAULT_BANKS];
      return this.banks;
    }

    try {
      const stored = localStorage.getItem(BANKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.banks = parsed;
          return this.banks;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored banks:', e);
    }

    this.banks = [...DEFAULT_BANKS];
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
    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          const items: BankItem[] = await res.json();
          this.banks = items;
          this.saveToLocalStorage();
          return [...this.banks];
        }
      }
    } catch (e) {
      // Fall through to direct LibSQL client execution below
    }

    // 2. Try direct LibSQL client if available
    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM banks ORDER BY name ASC');
        if (res.rows && res.rows.length > 0) {
          const dbItems: BankItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            isDefault: Boolean(row.is_default),
          }));
          this.banks = dbItems;
          this.saveToLocalStorage();
          return [...this.banks];
        } else {
          // Table is empty, insert default banks to database
          for (const bank of DEFAULT_BANKS) {
            await client.execute({
              sql: `INSERT INTO banks (id, name, is_default) VALUES (?, ?, ?)`,
              args: [bank.id, bank.name, bank.isDefault ? 1 : 0],
            });
          }
          this.banks = [...DEFAULT_BANKS];
          this.saveToLocalStorage();
          return [...this.banks];
        }
      } catch (e) {
        console.warn('Could not fetch banks from Turso DB, using local cache:', e);
      }
    }

    return this.loadFromLocalStorage();
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
      isDefault: false,
    };

    this.banks = [...this.banks, newBank];
    this.saveToLocalStorage();

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ name: trimmed }),
        });
        if (res.ok) {
          const created: BankItem = await res.json();
          return created;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Persist to Turso Cloud DB directly if client connected
    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'INSERT INTO banks (id, name, is_default) VALUES (?, ?, ?)',
          args: [newBank.id, newBank.name, 0],
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

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, name: trimmed }),
        });
        if (res.ok) {
          const updatedBank: BankItem = await res.json();
          return updatedBank;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Update in Turso DB directly if client connected
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
    this.banks = this.banks.filter((b) => b.id !== id);
    this.saveToLocalStorage();

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/banks?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          return true;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Delete from Turso DB directly if client connected
    const client = tursoService.getClient();
    if (client) {
      try {
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
    this.banks = [...DEFAULT_BANKS];
    this.saveToLocalStorage();

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks?action=reset', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          const resetItems: BankItem[] = await res.json();
          this.banks = resetItems;
          this.saveToLocalStorage();
          return [...this.banks];
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Reset in Turso DB directly if client connected
    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute('DELETE FROM banks');
        for (const bank of DEFAULT_BANKS) {
          await client.execute({
            sql: `INSERT INTO banks (id, name, is_default) VALUES (?, ?, ?)`,
            args: [bank.id, bank.name, bank.isDefault ? 1 : 0],
          });
        }
      } catch (err) {
        console.error('Failed to reset banks in Turso DB:', err);
      }
    }

    return [...this.banks];
  }
}

export const bankService = new BankService();
