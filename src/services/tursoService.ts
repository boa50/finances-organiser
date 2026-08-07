import { createClient, Client } from '@libsql/client/web';
import { Transaction, TursoConfig } from '../types';
import { DEFAULT_CATEGORIES } from './categoryService';

const CONFIG_KEY = 'finances_turso_config';
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

  public async testConnection(url: string, authToken: string): Promise<{ success: boolean; message: string }> {
    // Attempt testing via Vercel serverless health function first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-turso-db-url': url.trim(),
            'x-turso-auth-token': authToken.trim(),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isConnected) {
            return { success: true, message: data.message || 'Successfully connected to Turso Cloud Database via Serverless API!' };
          }
        }
      }
    } catch (e) {
      // Ignore API fetch error and fall back to direct LibSQL client check
    }

    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('libsql://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      const tempClient = createClient({
        url: cleanUrl,
        authToken: authToken.trim(),
      });

      const res = await tempClient.execute('SELECT 1 as ping');
      if (res.rows && res.rows.length > 0) {
        return { success: true, message: 'Successfully connected to Turso Cloud Database!' };
      }
      return { success: false, message: 'Connected, but received invalid response from database' };
    } catch (err: any) {
      console.error('Turso connection error:', err);
      return {
        success: false,
        message: err?.message || 'Failed to connect to Turso. Please check database URL and Auth Token.',
      };
    }
  }

  public async initDatabase(): Promise<boolean> {
    // Try initializing via Vercel serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/health', {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (res.ok) {
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
          date TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);

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
        if (res.ok) {
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
      const res = await this.client.execute(
        'SELECT * FROM transactions ORDER BY date DESC'
      );
      const items: Transaction[] = res.rows.map((row: any) => ({
        id: String(row.id),
        type: row.type as 'income' | 'expense',
        title: String(row.title),
        amount: Number(row.amount),
        currency: String(row.currency),
        category: String(row.category),
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
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
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
        if (res.ok) {
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
          sql: `INSERT INTO transactions (id, type, title, amount, currency, category, date, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newTx.id,
            newTx.type,
            newTx.title,
            newTx.amount,
            newTx.currency,
            newTx.category,
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
        if (res.ok) {
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
        if (res.ok) {
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
                SET type = ?, title = ?, amount = ?, currency = ?, category = ?, date = ?, notes = ?
                WHERE id = ?`,
          args: [
            updatedTx.type,
            updatedTx.title,
            updatedTx.amount,
            updatedTx.currency,
            updatedTx.category,
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
