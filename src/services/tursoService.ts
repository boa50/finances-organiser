import { createClient, Client } from '@libsql/client/web';
import { Transaction, TursoConfig } from '../types';
import { generateId } from '../utils/idGenerator';
import { parseInstallmentTitle } from '../utils/financials';
import { isJsonResponse } from './apiClient';

const LOCAL_TX_KEY = 'finances_local_transactions';

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
      // Fallback below
    }

    if (!this.config.url || !this.config.authToken) {
      return false;
    }

    if (!this.client) {
      this.initClient(this.config.url, this.config.authToken);
    }

    if (!this.client) return false;

    try {
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          type TEXT CHECK (type IN ('income', 'expense')),
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          category_id TEXT,
          payment_method_id TEXT,
          bank_id TEXT,
          store TEXT,
          installments INTEGER DEFAULT 0,
          installment_number INTEGER DEFAULT 0,
          installment_group_id TEXT,
          subscription_id TEXT,
          date TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);

      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN category_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN payment_method_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN bank_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN store TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN installments INTEGER DEFAULT 0'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN installment_number INTEGER DEFAULT 0'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN installment_group_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE transactions ADD COLUMN subscription_id TEXT'); } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          category_id TEXT,
          payment_method_id TEXT,
          bank_id TEXT,
          store TEXT,
          billing_day INTEGER NOT NULL DEFAULT 1,
          active INTEGER NOT NULL DEFAULT 1,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN category_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN payment_method_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN bank_id TEXT'); } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT CHECK (type IN ('income', 'expense'))
        );
      `);

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          allow_installments INTEGER DEFAULT 0
        );
      `);

      try { await this.client.execute('ALTER TABLE payment_methods ADD COLUMN allow_installments INTEGER DEFAULT 0'); } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS banks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );
      `);

      this.config.isConnected = true;
      this.config.lastSyncedAt = new Date().toISOString();

      await this.fetchFromTurso();
      return true;
    } catch (err) {
      console.error('Turso init error:', err);
      this.config.isConnected = false;
      return false;
    }
  }

  private async fetchFromTurso(): Promise<Transaction[]> {
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
      // Fallback below
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
        categoryId: row.category_id ? String(row.category_id) : undefined,
        paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
        bankId: row.bank_id ? String(row.bank_id) : undefined,
        store: row.store ? String(row.store) : undefined,
        installments: Number(row.installments) || 0,
        installmentNumber: Number(row.installment_number) || 0,
        installmentGroupId: row.installment_group_id ? String(row.installment_group_id) : undefined,
        subscriptionId: row.subscription_id ? String(row.subscription_id) : undefined,
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

    this.localMemoryTx = [newTx, ...this.localMemoryTx];
    this.saveLocalCache();

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
      // Fallback
    }

    if (this.client) {
      try {
        await this.client.execute({
          sql: `INSERT INTO transactions (id, type, title, amount, currency, category_id, payment_method_id, bank_id, store, installments, installment_number, installment_group_id, subscription_id, date, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newTx.id,
            newTx.type,
            newTx.title,
            newTx.amount,
            newTx.currency,
            newTx.categoryId || null,
            newTx.paymentMethodId || null,
            newTx.bankId || null,
            newTx.store || null,
            newTx.installments || 0,
            newTx.installmentNumber || 0,
            newTx.installmentGroupId || null,
            newTx.subscriptionId || null,
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
      // Fallback
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

    this.localMemoryTx = this.localMemoryTx.filter((t) => {
      if (siblingIds.includes(t.id)) return false;
      if (groupId && t.installmentGroupId === groupId) return false;
      return true;
    });
    this.saveLocalCache();

    if (groupId) {
      try {
        if (typeof window !== 'undefined') {
          await fetch(`/api/transactions?groupId=${encodeURIComponent(groupId)}`, {
            method: 'DELETE',
            headers: this.getApiHeaders(),
          });
        }
      } catch (e) {
        // Fallback
      }
    }

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

      for (const id of siblingIds) {
        try {
          await this.client.execute({
            sql: 'DELETE FROM transactions WHERE id = ?',
            args: [id],
          });
        } catch (err) {
          // Ignore
        }
      }
    }

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
      // Fallback
    }

    if (this.client) {
      try {
        await this.client.execute({
          sql: `UPDATE transactions
                SET type = ?, title = ?, amount = ?, currency = ?, category_id = ?, payment_method_id = ?, bank_id = ?, store = ?, installments = ?, installment_number = ?, installment_group_id = ?, subscription_id = ?, date = ?, notes = ?
                WHERE id = ?`,
          args: [
            updatedTx.type,
            updatedTx.title,
            updatedTx.amount,
            updatedTx.currency,
            updatedTx.categoryId || null,
            updatedTx.paymentMethodId || null,
            updatedTx.bankId || null,
            updatedTx.store || null,
            updatedTx.installments || 0,
            updatedTx.installmentNumber || 0,
            updatedTx.installmentGroupId || null,
            updatedTx.subscriptionId || null,
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

  public removeCategoryReferences(catId: string): void {
    this.localMemoryTx = this.localMemoryTx.map((tx) => {
      if (tx.categoryId === catId) {
        return { ...tx, categoryId: undefined };
      }
      return tx;
    });
    this.saveLocalCache();
  }

  public removePaymentMethodReferences(pmId: string): void {
    this.localMemoryTx = this.localMemoryTx.map((tx) => {
      if (tx.paymentMethodId === pmId) {
        return { ...tx, paymentMethodId: undefined };
      }
      return tx;
    });
    this.saveLocalCache();
  }

  public removeBankReferences(bankId: string): void {
    this.localMemoryTx = this.localMemoryTx.map((tx) => {
      if (tx.bankId === bankId) {
        return { ...tx, bankId: undefined };
      }
      return tx;
    });
    this.saveLocalCache();
  }

  public async clearAllTransactions(): Promise<Transaction[]> {
    this.localMemoryTx = [];
    this.saveLocalCache();

    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/transactions?id=all', {
          method: 'DELETE',
          headers: this.getApiHeaders(),
        });
      }
    } catch (e) {
      // Fallback
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
