import { createClient, Client } from '@libsql/client/web';
import { BootstrapAppDataResult, PaginatedTransactionResult, Transaction, TransactionTotalsResponse, TursoConfig } from '../types';
import { generateId } from '../utils/idGenerator';
import { calculateInstallmentDate, filterTransactions, formatDateToYMD, normalizeTransactionDate, parseInstallmentTitle, parseTransactionDate } from '../utils/financials';
import { isJsonResponse } from './apiResponseUtils';

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
          currency_id TEXT NOT NULL,
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

      try { await this.client.execute('ALTER TABLE transactions RENAME COLUMN currency TO currency_id'); } catch (e) {}
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
          currency_id TEXT NOT NULL,
          category_id TEXT,
          payment_method_id TEXT,
          bank_id TEXT,
          store TEXT,
          frequency TEXT NOT NULL DEFAULT 'monthly',
          billing_day INTEGER NOT NULL DEFAULT 1,
          billing_month INTEGER,
          active INTEGER NOT NULL DEFAULT 1,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      try { await this.client.execute('ALTER TABLE subscriptions RENAME COLUMN currency TO currency_id'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN category_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN payment_method_id TEXT'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN bank_id TEXT'); } catch (e) {}
      try { await this.client.execute("ALTER TABLE subscriptions ADD COLUMN frequency TEXT NOT NULL DEFAULT 'monthly'"); } catch (e) {}
      try { await this.client.execute('ALTER TABLE subscriptions ADD COLUMN billing_month INTEGER'); } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS currencies (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          name TEXT NOT NULL,
          flag TEXT NOT NULL,
          display_order INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1
        );
      `);

      try { await this.client.execute('ALTER TABLE currencies ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1'); } catch (e) {}

      try {
        await this.client.execute(`
          INSERT OR IGNORE INTO currencies (id, symbol, name, flag, display_order, enabled)
          VALUES ('BRL', 'R$', 'Brazilian Real', '🇧🇷', 0, 1), ('USD', '$', 'US Dollar', '🇺🇸', 1, 1);
        `);
      } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT CHECK (type IN ('income', 'expense')),
          display_order INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1
        );
      `);

      try { await this.client.execute('ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE categories ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1'); } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          allow_installments INTEGER DEFAULT 0,
          display_order INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1
        );
      `);

      try { await this.client.execute('ALTER TABLE payment_methods ADD COLUMN allow_installments INTEGER DEFAULT 0'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE payment_methods ADD COLUMN display_order INTEGER DEFAULT 0'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE payment_methods ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1'); } catch (e) {}

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS banks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          display_order INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1
        );
      `);

      try { await this.client.execute('ALTER TABLE banks ADD COLUMN display_order INTEGER DEFAULT 0'); } catch (e) {}
      try { await this.client.execute('ALTER TABLE banks ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1'); } catch (e) {}

      this.config.isConnected = true;
      this.config.lastSyncedAt = new Date().toISOString();
      return true;
    } catch (err) {
      console.error('Turso init error:', err);
      this.config.isConnected = false;
      return false;
    }
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      id: String(row.id),
      type: row.type as any,
      title: String(row.title),
      amount: Number(row.amount),
      currencyId: String(row.currency_id || row.currency || 'BRL'),
      categoryId: row.category_id ? String(row.category_id) : undefined,
      paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
      bankId: row.bank_id ? String(row.bank_id) : undefined,
      store: row.store ? String(row.store) : undefined,
      installments: Number(row.installments) || 0,
      installmentNumber: Number(row.installment_number) || 0,
      installmentGroupId: row.installment_group_id ? String(row.installment_group_id) : undefined,
      subscriptionId: row.subscription_id ? String(row.subscription_id) : undefined,
      date: normalizeTransactionDate(String(row.date)),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at || row.date),
    };
  }

  private mergeIntoLocalCache(items: Transaction[]): void {
    const map = new Map<string, Transaction>();
    for (const tx of this.localMemoryTx) {
      map.set(tx.id, tx);
    }
    for (const tx of items) {
      map.set(tx.id, tx);
    }
    this.localMemoryTx = Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.saveLocalCache();
  }

  private syncRecentIntoLocalCache(items: Transaction[], sinceDays: number = 60): void {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    const sinceStr = formatDateToYMD(sinceDate);
    const sinceTimestamp = parseTransactionDate(sinceStr).getTime();

    // Retain only older items strictly outside the recent window
    const olderItems = this.localMemoryTx.filter((t) => {
      const tTime = parseTransactionDate(t.date).getTime();
      return !isNaN(tTime) && tTime < sinceTimestamp;
    });

    const map = new Map<string, Transaction>();
    for (const tx of olderItems) {
      map.set(tx.id, tx);
    }
    for (const tx of items) {
      map.set(tx.id, tx);
    }

    this.localMemoryTx = Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.saveLocalCache();
  }

  private async fetchFromTurso(): Promise<Transaction[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transactions', {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data = await res.json();
          const items: Transaction[] = Array.isArray(data) ? data : data.transactions || [];
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
      const res = await this.client.execute('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
      const items: Transaction[] = res.rows.map((row: any) => this.mapRowToTransaction(row));

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

  public async getRecentTransactions(sinceDays: number = 60): Promise<Transaction[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    const sinceStr = formatDateToYMD(sinceDate);
    const sinceDateStr = sinceStr.slice(0, 10);

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/transactions?since=${encodeURIComponent(sinceDateStr)}`, {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data = await res.json();
          const items: Transaction[] = Array.isArray(data) ? data : data.transactions || [];
          this.syncRecentIntoLocalCache(items, sinceDays);
          this.config.isConnected = true;
          return items;
        }
      }
    } catch (e) {
      // Fallback below
    }

    if (this.client) {
      try {
        const res = await this.client.execute({
          sql: 'SELECT * FROM transactions WHERE substr(date, 1, 10) >= ? ORDER BY date DESC, created_at DESC',
          args: [sinceDateStr],
        });
        const items = res.rows.map((row: any) => this.mapRowToTransaction(row));
        this.syncRecentIntoLocalCache(items, sinceDays);
        this.config.isConnected = true;
        return items;
      } catch (err) {
        console.warn('Error fetching recent from Turso:', err);
        this.config.isConnected = false;
      }
    }

    const sinceTimestamp = parseTransactionDate(sinceDateStr).getTime();
    return this.localMemoryTx.filter((t) => {
      const tTime = parseTransactionDate(t.date).getTime();
      return !isNaN(tTime) && tTime >= sinceTimestamp;
    });
  }

  public getLocalRecentTransactions(sinceDays: number = 60): Transaction[] {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    const sinceStr = formatDateToYMD(sinceDate);
    const sinceTimestamp = parseTransactionDate(sinceStr).getTime();
    return this.localMemoryTx.filter((t) => {
      const tTime = parseTransactionDate(t.date).getTime();
      return !isNaN(tTime) && tTime >= sinceTimestamp;
    });
  }

  public getLocalTransactionCount(): number {
    return this.localMemoryTx.length;
  }

  public async bootstrapAppData(sinceDays: number = 60): Promise<BootstrapAppDataResult> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    const sinceStr = formatDateToYMD(sinceDate);
    const sinceDateStr = sinceStr.slice(0, 10);

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/bootstrap?since=${encodeURIComponent(sinceDateStr)}`, {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data: BootstrapAppDataResult = await res.json();
          if (data && Array.isArray(data.recentTransactions)) {
            this.syncRecentIntoLocalCache(data.recentTransactions, sinceDays);
            this.config.isConnected = true;
            this.config.lastSyncedAt = new Date().toISOString();
            return {
              currencies: data.currencies,
              categories: data.categories,
              paymentMethods: data.paymentMethods,
              banks: data.banks,
              recentTransactions: data.recentTransactions,
              totalCount: typeof data.totalCount === 'number' ? data.totalCount : data.recentTransactions.length,
            };
          }
        }
      }
    } catch (e) {
      // Fallback below
    }

    if (this.client) {
      try {
        const [currenciesRes, categoriesRes, paymentMethodsRes, banksRes, countRes, txRes] = await Promise.all([
          this.client.execute('SELECT * FROM currencies ORDER BY display_order ASC'),
          this.client.execute('SELECT * FROM categories ORDER BY display_order ASC, name ASC'),
          this.client.execute('SELECT * FROM payment_methods ORDER BY display_order ASC, name ASC'),
          this.client.execute('SELECT * FROM banks ORDER BY display_order ASC, name ASC'),
          this.client.execute('SELECT COUNT(*) as total FROM transactions'),
          this.client.execute({
            sql: 'SELECT * FROM transactions WHERE substr(date, 1, 10) >= ? ORDER BY date DESC, created_at DESC',
            args: [sinceDateStr],
          }),
        ]);

        const currencies = (currenciesRes.rows || []).map((row: any) => ({
          code: String(row.id),
          symbol: String(row.symbol),
          name: String(row.name),
          flag: String(row.flag),
          displayOrder: Number(row.display_order ?? 0),
          enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
        }));

        const categories = (categoriesRes.rows || []).map((row: any) => ({
          id: String(row.id),
          name: String(row.name),
          icon: String(row.icon),
          color: String(row.color),
          type: row.type as any,
          displayOrder: Number(row.display_order ?? 0),
          enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
        }));

        const paymentMethods = (paymentMethodsRes.rows || []).map((row: any) => ({
          id: String(row.id),
          name: String(row.name),
          allowInstallments: Boolean(row.allow_installments),
          displayOrder: Number(row.display_order ?? 0),
          enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
        }));

        const banks = (banksRes.rows || []).map((row: any) => ({
          id: String(row.id),
          name: String(row.name),
          displayOrder: Number(row.display_order ?? 0),
          enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
        }));

        const recent = (txRes.rows || []).map((row: any) => this.mapRowToTransaction(row));
        const total = Number(countRes.rows[0]?.total || 0);

        this.syncRecentIntoLocalCache(recent, sinceDays);
        this.config.isConnected = true;
        this.config.lastSyncedAt = new Date().toISOString();

        return {
          currencies,
          categories,
          paymentMethods,
          banks,
          recentTransactions: recent,
          totalCount: total,
        };
      } catch (err) {
        console.warn('Error fetching bootstrap data from direct Turso client:', err);
        this.config.isConnected = false;
      }
    }

    const localRecent = this.getLocalRecentTransactions(sinceDays);
    return {
      recentTransactions: localRecent,
      totalCount: this.localMemoryTx.length,
    };
  }

  public async getTransactionsPaginated(
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedTransactionResult> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/transactions?limit=${limit}&offset=${offset}`, {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data: PaginatedTransactionResult = await res.json();
          this.mergeIntoLocalCache(data.transactions || []);
          this.config.isConnected = true;
          return data;
        }
      }
    } catch (e) {
      // Fallback below
    }

    if (this.client) {
      try {
        const countRes = await this.client.execute('SELECT COUNT(*) as total FROM transactions');
        const total = Number(countRes.rows[0]?.total || 0);

        const res = await this.client.execute({
          sql: 'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?',
          args: [limit, offset],
        });
        const items = res.rows.map((row: any) => this.mapRowToTransaction(row));
        this.mergeIntoLocalCache(items);
        this.config.isConnected = true;
        return {
          transactions: items,
          total,
          hasMore: offset + items.length < total,
        };
      } catch (err) {
        console.warn('Error fetching paginated transactions from Turso:', err);
        this.config.isConnected = false;
      }
    }

    const total = this.localMemoryTx.length;
    const slice = this.localMemoryTx.slice(offset, offset + limit);
    return {
      transactions: slice,
      total,
      hasMore: offset + slice.length < total,
    };
  }

  public async searchTransactionsRemote(
    query: string,
    type: 'all' | 'income' | 'expense' = 'all',
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedTransactionResult> {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams({
          search: query,
          type,
          limit: String(limit),
          offset: String(offset),
        });
        const res = await fetch(`/api/transactions?${params.toString()}`, {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data: PaginatedTransactionResult = await res.json();
          this.mergeIntoLocalCache(data.transactions || []);
          this.config.isConnected = true;
          return data;
        }
      }
    } catch (e) {
      // Fallback below
    }

    if (this.client) {
      try {
        const s = `%${query.trim()}%`;
        const whereClauses = ['(transactions.title LIKE ? OR transactions.store LIKE ? OR transactions.notes LIKE ? OR categories.name LIKE ?)'];
        const args: any[] = [s, s, s, s];

        if (type !== 'all') {
          whereClauses.push('transactions.type = ?');
          args.push(type);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        const countRes = await this.client.execute({
          sql: `SELECT COUNT(*) as total FROM transactions LEFT JOIN categories ON transactions.category_id = categories.id ${whereSql}`,
          args: [...args],
        });
        const total = Number(countRes.rows[0]?.total || 0);

        const res = await this.client.execute({
          sql: `SELECT transactions.* FROM transactions LEFT JOIN categories ON transactions.category_id = categories.id ${whereSql} ORDER BY transactions.date DESC, transactions.created_at DESC LIMIT ? OFFSET ?`,
          args: [...args, limit, offset],
        });
        const items = res.rows.map((row: any) => this.mapRowToTransaction(row));
        this.mergeIntoLocalCache(items);
        this.config.isConnected = true;
        return {
          transactions: items,
          total,
          hasMore: offset + items.length < total,
        };
      } catch (err) {
        console.warn('Error searching remote transactions:', err);
        this.config.isConnected = false;
      }
    }

    const filtered = filterTransactions(this.localMemoryTx, {
      searchQuery: query,
      type,
    });
    const total = filtered.length;
    const slice = filtered.slice(offset, offset + limit);
    return {
      transactions: slice,
      total,
      hasMore: offset + slice.length < total,
    };
  }

  public async getTransactionCount(): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transactions?count=true', {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const data = await res.json();
          if (typeof data.total === 'number') {
            return data.total;
          }
        }
      }
    } catch (e) {
      // Fallback below
    }

    if (this.client) {
      try {
        const res = await this.client.execute('SELECT COUNT(*) as total FROM transactions');
        return Number(res.rows[0]?.total || 0);
      } catch (err) {
        // Fallback
      }
    }

    return this.localMemoryTx.length;
  }

  public async getTransactionTotals(): Promise<TransactionTotalsResponse> {
    try {
      if (typeof window !== 'undefined') {
        let res = await fetch('/api/transactions-totals', {
          method: 'GET',
          headers: this.getApiHeaders(),
        });
        if (!isJsonResponse(res)) {
          res = await fetch('/api/transactions?totals=true', {
            method: 'GET',
            headers: this.getApiHeaders(),
          });
        }
        if (isJsonResponse(res)) {
          const data: TransactionTotalsResponse = await res.json();
          return data;
        }
      }
    } catch (e) {
      // Fallback below
    }

    if (this.client) {
      try {
        const res = await this.client.execute(`
          SELECT currency_id, type, SUM(amount) as total
          FROM transactions
          GROUP BY currency_id, type
        `);
        const byCurrency: Record<string, { income: number; expense: number }> = {};
        for (const row of res.rows) {
          const curr = String(row.currency_id || 'BRL');
          const type = String(row.type);
          const total = Number(row.total || 0);
          if (!byCurrency[curr]) {
            byCurrency[curr] = { income: 0, expense: 0 };
          }
          if (type === 'income') {
            byCurrency[curr].income += total;
          } else if (type === 'expense') {
            byCurrency[curr].expense += total;
          }
        }
        return { byCurrency };
      } catch (err) {
        // Fallback below
      }
    }

    const byCurrency: Record<string, { income: number; expense: number }> = {};
    for (const tx of this.localMemoryTx) {
      const curr = tx.currencyId || 'BRL';
      if (!byCurrency[curr]) {
        byCurrency[curr] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        byCurrency[curr].income += tx.amount;
      } else if (tx.type === 'expense') {
        byCurrency[curr].expense += tx.amount;
      }
    }
    return { byCurrency };
  }

  public async addTransaction(
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> {
    const normalizedData = {
      ...txData,
      date: normalizeTransactionDate(txData.date),
    };
    const newTx: Transaction = {
      ...normalizedData,
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
          body: JSON.stringify(normalizedData),
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
          sql: `INSERT INTO transactions (id, type, title, amount, currency_id, category_id, payment_method_id, bank_id, store, installments, installment_number, installment_group_id, subscription_id, date, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newTx.id,
            newTx.type,
            newTx.title,
            newTx.amount,
            newTx.currencyId,
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

    const normalizedData = {
      ...txData,
      date: normalizeTransactionDate(txData.date),
    };

    const updatedTx: Transaction = {
      ...existing,
      ...normalizedData,
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
          body: JSON.stringify({ id, ...normalizedData }),
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
                SET type = ?, title = ?, amount = ?, currency_id = ?, category_id = ?, payment_method_id = ?, bank_id = ?, store = ?, installments = ?, installment_number = ?, installment_group_id = ?, subscription_id = ?, date = ?, notes = ?
                WHERE id = ?`,
          args: [
            updatedTx.type,
            updatedTx.title,
            updatedTx.amount,
            updatedTx.currencyId,
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

  public async duplicateTransaction(targetTx: Transaction): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    const existing = transactions.find((t) => t.id === targetTx.id);
    if (!existing) {
      throw new Error('Transaction not found');
    }

    const currentDate = new Date();

    if (existing.installments && existing.installments > 1) {
      const groupId = existing.installmentGroupId || '';
      const baseTitle = parseInstallmentTitle(existing.title).toLowerCase();
      const totalInst = existing.installments;

      const siblings = transactions.filter((t) => {
        if (groupId && t.installmentGroupId === groupId) return true;
        if (t.id === existing.id) return true;
        if (baseTitle && totalInst > 1 && t.installments === totalInst) {
          const tBase = parseInstallmentTitle(t.title).toLowerCase();
          if (tBase === baseTitle) return true;
        }
        return false;
      });

      siblings.sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1));

      const cleanBaseTitle = parseInstallmentTitle(existing.title);
      const newGroupId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const createdTransactions: Transaction[] = [];

      for (let i = 1; i <= totalInst; i++) {
        const installmentDate = calculateInstallmentDate(currentDate, i - 1);

        const template = siblings.find((s) => s.installmentNumber === i) || existing;

        const duplicatedData: Omit<Transaction, 'id' | 'createdAt'> = {
          type: template.type,
          title: `${cleanBaseTitle} (${i}/${totalInst})`,
          amount: template.amount,
          currencyId: template.currencyId,
          categoryId: template.categoryId,
          paymentMethodId: template.paymentMethodId,
          bankId: template.bankId,
          store: template.store,
          installments: totalInst,
          installmentNumber: i,
          installmentGroupId: newGroupId,
          subscriptionId: undefined,
          date: normalizeTransactionDate(installmentDate),
          notes: template.notes,
        };

        const created = await this.addTransaction(duplicatedData);
        createdTransactions.push(created);
      }

      return createdTransactions;
    }

    const duplicatedData: Omit<Transaction, 'id' | 'createdAt'> = {
      type: existing.type,
      title: existing.title,
      amount: existing.amount,
      currencyId: existing.currencyId,
      categoryId: existing.categoryId,
      paymentMethodId: existing.paymentMethodId,
      bankId: existing.bankId,
      store: existing.store,
      installments: 0,
      installmentNumber: 0,
      installmentGroupId: undefined,
      subscriptionId: undefined,
      date: normalizeTransactionDate(currentDate),
      notes: existing.notes,
    };

    const created = await this.addTransaction(duplicatedData);
    return [created];
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
