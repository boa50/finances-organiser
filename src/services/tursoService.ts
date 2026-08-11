import { createClient, Client } from '@libsql/client/web';
import { Transaction, TursoConfig } from '../types';
import { DEFAULT_CATEGORIES } from './categoryService';
import { generateId } from '../utils/idGenerator';
import { parseInstallmentTitle } from '../utils/financials';
import { isJsonResponse } from './apiClient';

const LOCAL_TX_KEY = 'finances_local_transactions';

// Expo only exposes variables prefixed with EXPO_PUBLIC_ to application code.
// These values are compiled into the client bundle, so use a token scoped only
// to this database and never treat it as a server-side secret.
const ENV_TURSO_URL = process.env.EXPO_PUBLIC_TURSO_DATABASE_URL?.trim() ?? '';
const ENV_TURSO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN?.trim() ?? '';

class TursoDatabaseService {
  private client: Client | null = null;
  private config: TursoConfig = {
    url: '',
    authToken: '',
    isConnected: false,
  };
  private localMemoryTx: Transaction[] = [];

  constructor() {
    this.loadSavedConfig();
    this.loadLocalCache();
  }

  private loadSavedConfig() {
    const isEnvConfigured = Boolean(ENV_TURSO_URL && ENV_TURSO_AUTH_TOKEN);

    this.config = {
      url: ENV_TURSO_URL,
      authToken: ENV_TURSO_AUTH_TOKEN,
      isConnected: false,
      isEnvConfigured,
    };

    if (this.config.url && this.config.authToken) {
      this.initClient(this.config.url, this.config.authToken);
    }
  }

  public getClient(): Client | null {
    return this.client;
  }

  private loadLocalCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(LOCAL_TX_KEY);
        if (saved) {
          this.localMemoryTx = JSON.parse(saved);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load local transactions', e);
    }
    // Default fallback to empty array
    this.localMemoryTx = [];
    this.saveLocalCache();
  }

  private saveLocalCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(this.localMemoryTx));
      }
    } catch (e) {
      console.warn('Failed to save local transactions', e);
    }
  }

  private initClient(url: string, authToken: string): boolean {
    try {
      // Ensure URL is formatted cleanly (support libsql://, https://, or http://)
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('libsql://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      this.client = createClient({
        url: cleanUrl,
        authToken: authToken.trim(),
      });
      return true;
    } catch (err) {
      console.error('Turso client initialization error:', err);
      this.client = null;
      return false;
    }
  }

  public getConfig(): TursoConfig {
    return { ...this.config };
  }

  public getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.url) {
      headers['x-turso-db-url'] = this.config.url;
    }
    if (this.config.authToken) {
      headers['x-turso-auth-token'] = this.config.authToken;
    }
    return headers;
  }



  public async initDatabase(): Promise<boolean> {
    // Try initializing via Vercel serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/health', {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data = await res.json();
          if (data.isConnected) {
            this.config.isConnected = true;
            this.config.lastSyncedAt = new Date().toISOString();
            await this.fetchFromTurso();
            return true;
          }
        }
      }
    } catch (e) {
      // Fallback to client-side LibSQL initialization below
    }

    if (!this.config.url || !this.config.authToken) {
      return false;
    }

    if (!this.client) {
      this.initClient(this.config.url, this.config.authToken);
    }

    if (!this.client) return false;

    try {
      // Create tables
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          type TEXT CHECK (type IN ('income', 'expense')),
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          category TEXT NOT NULL,
          payment_method TEXT,
          bank TEXT,
          store TEXT,
          installments INTEGER DEFAULT 0,
          installment_number INTEGER DEFAULT 0,
          installment_group_id TEXT,
          date TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // Migration: Add payment_method column if existing table lacks it
      try {
        await this.client.execute('ALTER TABLE transactions ADD COLUMN payment_method TEXT');
      } catch (e) {
        // Column already exists
      }

      // Migration: Add store column if existing table lacks it
      try {
        await this.client.execute('ALTER TABLE transactions ADD COLUMN store TEXT');
      } catch (e) {
        // Column already exists
      }

      // Migration: Add bank column if existing table lacks it
      try {
        await this.client.execute('ALTER TABLE transactions ADD COLUMN bank TEXT');
      } catch (e) {
        // Column already exists
      }

      // Migration: Add installments column if existing table lacks it
      try {
        await this.client.execute('ALTER TABLE transactions ADD COLUMN installments INTEGER DEFAULT 0');
      } catch (e) {
        // Column already exists
      }

      // Migration: Add installment_number column if existing table lacks it
      try {
        await this.client.execute('ALTER TABLE transactions ADD COLUMN installment_number INTEGER DEFAULT 0');
      } catch (e) {
        // Column already exists
      }

      // Migration: Add installment_group_id column if existing table lacks it
      try {
        await this.client.execute('ALTER TABLE transactions ADD COLUMN installment_group_id TEXT');
      } catch (e) {
        // Column already exists
      }

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT CHECK (type IN ('income', 'expense')),
          is_default INTEGER DEFAULT 0
        );
      `);

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          is_default INTEGER DEFAULT 0,
          allow_installments INTEGER DEFAULT 0
        );
      `);

      try {
        await this.client.execute('ALTER TABLE payment_methods ADD COLUMN allow_installments INTEGER DEFAULT 0');
      } catch (e) {
        // Column already exists
      }

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS banks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          is_default INTEGER DEFAULT 0
        );
      `);

      this.config.isConnected = true;
      this.config.lastSyncedAt = new Date().toISOString();

      // Check if categories table has data. If empty, insert default categories into Turso DB!
      const catCountRes = await this.client.execute('SELECT COUNT(*) as count FROM categories');
      const catCount = Number(catCountRes.rows[0]?.count || 0);

      if (catCount === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await this.client.execute({
            sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0],
          });
        }
      }

      // Check if payment_methods table has data. If empty, insert defaults!
      const pmCountRes = await this.client.execute('SELECT COUNT(*) as count FROM payment_methods');
      const pmCount = Number(pmCountRes.rows[0]?.count || 0);

      if (pmCount === 0) {
        const defaults = [
          { id: 'pm-1', name: 'Credit Card', isDefault: 1, allowInstallments: 1 },
          { id: 'pm-2', name: 'Debit Card', isDefault: 1, allowInstallments: 0 },
          { id: 'pm-3', name: 'Money Transfer', isDefault: 1, allowInstallments: 0 },
        ];
        for (const pm of defaults) {
          await this.client.execute({
            sql: `INSERT INTO payment_methods (id, name, is_default, allow_installments) VALUES (?, ?, ?, ?)`,
            args: [pm.id, pm.name, pm.isDefault, pm.allowInstallments],
          });
        }
      }

      // Sync data from Turso to local memory
      await this.fetchFromTurso();
      return true;
    } catch (err) {
      console.error('Turso init error:', err);
      this.config.isConnected = false;
      return false;
    }
  }

  private async fetchFromTurso(): Promise<Transaction[]> {
    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transactions', {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const items: Transaction[] = await res.json();
          this.localMemoryTx = items;
          this.saveLocalCache();
          this.config.isConnected = true;
          return items;
        }
      }
    } catch (e) {
      // Fall through to LibSQL client execution
    }

    if (!this.client) return this.localMemoryTx;

    try {
      const res = await this.client.execute('SELECT * FROM transactions ORDER BY date DESC');
      const items: Transaction[] = res.rows.map((row: any) => ({
        id: String(row.id),
        type: row.type as any,
        title: String(row.title),
        amount: Number(row.amount),
        currency: String(row.currency),
        category: String(row.category),
        paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
        bank: row.bank ? String(row.bank) : undefined,
        store: row.store ? String(row.store) : undefined,
        installments: Number(row.installments) || 0,
        installmentNumber: Number(row.installment_number) || 0,
        installmentGroupId: row.installment_group_id ? String(row.installment_group_id) : undefined,
        date: String(row.date),
        notes: row.notes ? String(row.notes) : undefined,
        createdAt: String(row.created_at || row.date),
      }));

      this.localMemoryTx = items;
      this.saveLocalCache();
      this.config.isConnected = true;
      return items;
    } catch (e) {
      console.warn('Error fetching from Turso:', e);
      this.config.isConnected = false;
      return this.localMemoryTx;
    }
  }

  public async getTransactions(): Promise<Transaction[]> {
    return await this.fetchFromTurso();
  }

  public async addTransaction(
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> {
    const newTx: Transaction = {
      ...txData,
      id: generateId('tx'),
      createdAt: new Date().toISOString(),
    };

    // Update local memory & cache immediately
    this.localMemoryTx = [newTx, ...this.localMemoryTx];
    this.saveLocalCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify(txData),
        });
        if (isJsonResponse(res)) {
          const created: Transaction = await res.json();
          this.config.isConnected = true;
          return created;
        }
      }
    } catch (e) {
      // Fall through to LibSQL client fallback
    }

    // Persist to Turso Cloud DB directly if connected
    if (this.client) {
      try {
        await this.client.execute({
          sql: `INSERT INTO transactions (id, type, title, amount, currency, category, payment_method, bank, store, installments, installment_number, installment_group_id, date, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newTx.id,
            newTx.type,
            newTx.title,
            newTx.amount,
            newTx.currency,
            newTx.category,
            newTx.paymentMethod || null,
            newTx.bank || null,
            newTx.store || null,
            newTx.installments || 0,
            newTx.installmentNumber || 0,
            newTx.installmentGroupId || null,
            newTx.date,
            newTx.notes || '',
            newTx.createdAt,
          ],
        });
        this.config.isConnected = true;
      } catch (err) {
        console.error('Failed to sync added transaction to Turso DB:', err);
      }
    }

    return newTx;
  }

  public async deleteTransaction(id: string): Promise<boolean> {
    this.localMemoryTx = this.localMemoryTx.filter((t) => t.id !== id);
    this.saveLocalCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          this.config.isConnected = true;
          return true;
        }
      }
    } catch (e) {
      // Fall through
    }

    if (this.client) {
      try {
        await this.client.execute({
          sql: 'DELETE FROM transactions WHERE id = ?',
          args: [id],
        });
      } catch (err) {
        console.error('Failed to delete transaction from Turso:', err);
      }
    }
    return true;
  }

  public async deleteTransactionGroup(groupId: string, targetTx?: Transaction): Promise<boolean> {
    const baseTitle = targetTx ? parseInstallmentTitle(targetTx.title).toLowerCase() : '';
    const totalInst = targetTx?.installments || 0;

    // 1. Identify all sibling transactions in local memory
    const siblingTx = this.localMemoryTx.filter((t) => {
      if (groupId && t.installmentGroupId === groupId) return true;
      if (targetTx && t.id === targetTx.id) return true;
      if (baseTitle && totalInst > 1 && t.installments === totalInst) {
        const tBase = parseInstallmentTitle(t.title).toLowerCase();
        if (tBase === baseTitle) return true;
      }
      return false;
    });

    const siblingIds = Array.from(new Set(siblingTx.map((t) => t.id)));

    // 2. Remove all matched siblings from local memory immediately
    this.localMemoryTx = this.localMemoryTx.filter((t) => {
      if (siblingIds.includes(t.id)) return false;
      if (groupId && t.installmentGroupId === groupId) return false;
      return true;
    });
    this.saveLocalCache();

    // 3. Delete from Vercel Serverless API if online
    if (groupId) {
      try {
        if (typeof window !== 'undefined') {
          await fetch(`/api/transactions?groupId=${encodeURIComponent(groupId)}`, {
            method: 'DELETE',
            headers: this.getApiHeaders(),
          });
        }
      } catch (e) {
        // Fall through
      }
    }

    // 4. Delete from Turso Cloud DB directly if client connected
    if (this.client) {
      if (groupId) {
        try {
          await this.client.execute({
            sql: 'DELETE FROM transactions WHERE installment_group_id = ?',
            args: [groupId],
          });
          this.config.isConnected = true;
        } catch (err) {
          console.error('Failed to delete transaction group from Turso:', err);
        }
      }

      // Also ensure all sibling IDs are deleted explicitly from Turso DB
      for (const id of siblingIds) {
        try {
          await this.client.execute({
            sql: 'DELETE FROM transactions WHERE id = ?',
            args: [id],
          });
        } catch (err) {
          // Ignore if already deleted by group query
        }
      }
    }

    // 5. Also issue DELETE requests for sibling IDs via API as safety fallback
    if (typeof window !== 'undefined' && siblingIds.length > 0) {
      for (const id of siblingIds) {
        try {
          await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: this.getApiHeaders(),
          });
        } catch (e) {
          // Ignore
        }
      }
    }

    return true;
  }

  public async updateTransaction(
    id: string,
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> {
    const existing = this.localMemoryTx.find((transaction) => transaction.id === id);
    if (!existing) {
      throw new Error('Transaction not found');
    }

    const updatedTx: Transaction = {
      ...existing,
      ...txData,
    };

    this.localMemoryTx = this.localMemoryTx.map((transaction) =>
      transaction.id === id ? updatedTx : transaction
    );
    this.saveLocalCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transactions', {
          method: 'PUT',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ id, ...txData }),
        });
        if (isJsonResponse(res)) {
          const updated: Transaction = await res.json();
          this.config.isConnected = true;
          return updated;
        }
      }
    } catch (e) {
      // Fall through
    }

    if (this.client) {
      try {
        await this.client.execute({
          sql: `UPDATE transactions
                SET type = ?, title = ?, amount = ?, currency = ?, category = ?, payment_method = ?, bank = ?, store = ?, installments = ?, installment_number = ?, installment_group_id = ?, date = ?, notes = ?
                WHERE id = ?`,
          args: [
            updatedTx.type,
            updatedTx.title,
            updatedTx.amount,
            updatedTx.currency,
            updatedTx.category,
            updatedTx.paymentMethod || null,
            updatedTx.bank || null,
            updatedTx.store || null,
            updatedTx.installments || 0,
            updatedTx.installmentNumber || 0,
            updatedTx.installmentGroupId || null,
            updatedTx.date,
            updatedTx.notes || '',
            id,
          ],
        });
        this.config.isConnected = true;
      } catch (error) {
        console.error('Failed to sync updated transaction to Turso:', error);
        this.config.isConnected = false;
      }
    }

    return updatedTx;
  }



  public async clearAllTransactions(): Promise<Transaction[]> {
    this.localMemoryTx = [];
    this.saveLocalCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/transactions?id=all', {
          method: 'DELETE',
          headers: this.getApiHeaders(),
        });
      }
    } catch (e) {
      // Fall through
    }

    if (this.client) {
      try {
        await this.client.execute('DELETE FROM transactions');
      } catch (e) {
        console.error('Failed to clear Turso database transactions', e);
      }
    }

    return [];
  }
}

export const tursoService = new TursoDatabaseService();
