import { BankItem } from '../types';
import { tursoService } from './tursoService';
import { subscriptionService } from './subscriptionService';
import { generateId } from '../utils/idGenerator';
import { isJsonResponse } from './apiClient';
import { getLocalStorageItem, setLocalStorageItem } from './localStorageHelper';

const BANKS_STORAGE_KEY = 'finances_custom_banks';

import { DEFAULT_BANKS } from '../constants/defaults';
export { DEFAULT_BANKS };

class BankService {
  private banks: BankItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): BankItem[] {
    this.banks = getLocalStorageItem<BankItem[]>(BANKS_STORAGE_KEY, []);
    return this.banks;
  }

  private saveToLocalStorage(): void {
    setLocalStorageItem(BANKS_STORAGE_KEY, this.banks);
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
        const res = await client.execute('SELECT * FROM banks ORDER BY display_order ASC, name ASC');
        if (res.rows) {
          const dbItems: BankItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            displayOrder: Number(row.display_order ?? 0),
            enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
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

  public async getEnabledBanks(): Promise<BankItem[]> {
    const all = await this.getBanks();
    return all.filter((b) => b.enabled !== false);
  }

  public getEnabledBanksSync(): BankItem[] {
    const all = this.getBanksSync();
    return all.filter((b) => b.enabled !== false);
  }

  public async reorderBanks(orderedIds: string[]): Promise<BankItem[]> {
    const idToOrder = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      idToOrder.set(id, index);
    });

    this.banks = this.banks.map((b) => {
      if (idToOrder.has(b.id)) {
        return { ...b, displayOrder: idToOrder.get(b.id)! };
      }
      return b;
    });

    this.banks.sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ action: 'reorder', orderedIds }),
        });
        if (isJsonResponse(res)) {
          return this.getBanks();
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        for (let index = 0; index < orderedIds.length; index++) {
          await client.execute({
            sql: 'UPDATE banks SET display_order = ? WHERE id = ?',
            args: [index, orderedIds[index]],
          });
        }
      } catch (err) {
        console.error('Failed to sync bank reorder to Turso DB:', err);
      }
    }

    return this.getBanks();
  }

  public async addBank(name: string, enabled: boolean = true): Promise<BankItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Bank name cannot be empty.');
    }

    const current = await this.getBanks();
    if (current.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A bank named "${trimmed}" already exists.`);
    }

    const nextOrder = this.banks.length > 0
      ? Math.max(...this.banks.map((b) => b.displayOrder ?? 0)) + 1
      : 0;

    const isEnabled = enabled !== undefined ? Boolean(enabled) : true;

    const newBank: BankItem = {
      id: generateId('bank'),
      name: trimmed,
      displayOrder: nextOrder,
      enabled: isEnabled,
    };

    this.banks = [...this.banks, newBank];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ name: trimmed, enabled: isEnabled }),
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
          sql: 'INSERT INTO banks (id, name, display_order, enabled) VALUES (?, ?, ?, ?)',
          args: [newBank.id, newBank.name, nextOrder, isEnabled ? 1 : 0],
        });
      } catch (err: any) {
        if (err?.message?.includes('no such column: enabled')) {
          try {
            await client.execute('ALTER TABLE banks ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
            await client.execute({
              sql: 'INSERT INTO banks (id, name, display_order, enabled) VALUES (?, ?, ?, ?)',
              args: [newBank.id, newBank.name, nextOrder, isEnabled ? 1 : 0],
            });
          } catch (retryErr) {
            console.error('Failed to sync added bank to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync added bank to Turso DB:', err);
        }
      }
    }

    return newBank;
  }

  public async updateBank(id: string, name: string, enabled?: boolean): Promise<BankItem> {
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
      enabled: enabled !== undefined ? Boolean(enabled) : (this.banks[index].enabled !== false),
    };

    this.banks[index] = updated;
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/banks', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, name: trimmed, enabled: updated.enabled }),
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
          sql: 'UPDATE banks SET name = ?, enabled = ? WHERE id = ?',
          args: [trimmed, updated.enabled ? 1 : 0, id],
        });
      } catch (err: any) {
        if (err?.message?.includes('no such column: enabled')) {
          try {
            await client.execute('ALTER TABLE banks ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
            await client.execute({
              sql: 'UPDATE banks SET name = ?, enabled = ? WHERE id = ?',
              args: [trimmed, updated.enabled ? 1 : 0, id],
            });
          } catch (retryErr) {
            console.error('Failed to sync bank update to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync bank update to Turso DB:', err);
        }
      }
    }

    return updated;
  }

  public async toggleBankEnabled(id: string, nextState?: boolean): Promise<BankItem> {
    const index = this.banks.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error('Bank not found.');
    }

    const current = this.banks[index];
    const newEnabled = nextState !== undefined ? nextState : !(current.enabled !== false);
    return this.updateBank(id, current.name, newEnabled);
  }

  public async deleteBank(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/banks?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          this.banks = this.banks.filter((b) => b.id !== id);
          this.saveToLocalStorage();
          tursoService.removeBankReferences(id);
          subscriptionService.removeBankReferences(id);
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

    this.banks = this.banks.filter((b) => b.id !== id);
    this.saveToLocalStorage();
    tursoService.removeBankReferences(id);
    subscriptionService.removeBankReferences(id);

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
