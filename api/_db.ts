import { createClient, Client } from '@libsql/client/web';
import type { VercelRequest } from '@vercel/node';

export const DEFAULT_CATEGORIES = [
  { id: 'cat-exp-0', name: 'Housing', icon: 'home', color: '#EF4444', type: 'expense', isDefault: true },
  { id: 'cat-exp-1', name: 'Groceries / Food', icon: 'utensils', color: '#F97316', type: 'expense', isDefault: true },
  { id: 'cat-exp-2', name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'cat-exp-3', name: 'Utilities', icon: 'zap', color: '#EAB308', type: 'expense', isDefault: true },
  { id: 'cat-exp-4', name: 'Entertainment', icon: 'tv', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat-exp-5', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'cat-exp-6', name: 'Health & Pharmacy', icon: 'activity', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'cat-exp-7', name: 'Education', icon: 'book', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'cat-exp-8', name: 'Travel', icon: 'plane', color: '#6366F1', type: 'expense', isDefault: true },
  { id: 'cat-exp-9', name: 'Subscriptions', icon: 'repeat', color: '#F43F5E', type: 'expense', isDefault: true },

  { id: 'cat-inc-0', name: 'Salary / Wages', icon: 'briefcase', color: '#10B981', type: 'income', isDefault: true },
  { id: 'cat-inc-1', name: 'Freelance / Projects', icon: 'laptop', color: '#3B82F6', type: 'income', isDefault: true },
  { id: 'cat-inc-2', name: 'Investments', icon: 'trending-up', color: '#8B5CF6', type: 'income', isDefault: true },
  { id: 'cat-inc-3', name: 'Gifts & Awards', icon: 'gift', color: '#EC4899', type: 'income', isDefault: true },
  { id: 'cat-inc-4', name: 'Rental Income', icon: 'key', color: '#F59E0B', type: 'income', isDefault: true },
];

export const DEFAULT_PAYMENT_METHODS = [
  { id: 'pm-1', name: 'Credit Card', isDefault: true },
  { id: 'pm-2', name: 'Debit Card', isDefault: true },
  { id: 'pm-3', name: 'Money Transfer', isDefault: true },
];

export const DEFAULT_BANKS = [
  { id: 'bank-1', name: 'Nubank', isDefault: true },
  { id: 'bank-2', name: 'Itaú', isDefault: true },
  { id: 'bank-3', name: 'Bradesco', isDefault: true },
  { id: 'bank-4', name: 'Caixa', isDefault: true },
];

export function getTursoClient(req?: VercelRequest): Client | null {
  const reqUrl = (req?.headers?.['x-turso-db-url'] as string) || '';
  const reqToken = (req?.headers?.['x-turso-auth-token'] as string) || '';

  const url =
    reqUrl.trim() ||
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.EXPO_PUBLIC_TURSO_DATABASE_URL?.trim() ||
    '';

  const authToken =
    reqToken.trim() ||
    process.env.TURSO_AUTH_TOKEN?.trim() ||
    process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN?.trim() ||
    '';

  if (!url || !authToken) {
    return null;
  }

  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('libsql://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    return createClient({
      url: cleanUrl,
      authToken: authToken.trim(),
    });
  } catch (e) {
    console.error('Failed to initialize Turso client in serverless function:', e);
    return null;
  }
}

export async function ensureTablesExist(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT CHECK (type IN ('income', 'expense')),
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      category TEXT NOT NULL,
      payment_method TEXT,
      store TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN payment_method TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN store TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN bank TEXT');
  } catch (e) {
    // Column already exists
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT CHECK (type IN ('income', 'expense')),
      is_default INTEGER DEFAULT 0
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_default INTEGER DEFAULT 0
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_default INTEGER DEFAULT 0
    );
  `);

  // If categories table is empty, insert default categories
  const catCountRes = await client.execute('SELECT COUNT(*) as count FROM categories');
  const catCount = Number(catCountRes.rows[0]?.count || 0);

  if (catCount === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await client.execute({
        sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0],
      });
    }
  }

  // If payment_methods table is empty, insert default payment methods
  const pmCountRes = await client.execute('SELECT COUNT(*) as count FROM payment_methods');
  const pmCount = Number(pmCountRes.rows[0]?.count || 0);

  if (pmCount === 0) {
    for (const pm of DEFAULT_PAYMENT_METHODS) {
      await client.execute({
        sql: `INSERT INTO payment_methods (id, name, is_default) VALUES (?, ?, ?)`,
        args: [pm.id, pm.name, pm.isDefault ? 1 : 0],
      });
    }
  }

  // If banks table is empty, insert default banks
  const bankCountRes = await client.execute('SELECT COUNT(*) as count FROM banks');
  const bankCount = Number(bankCountRes.rows[0]?.count || 0);

  if (bankCount === 0) {
    for (const bank of DEFAULT_BANKS) {
      await client.execute({
        sql: `INSERT INTO banks (id, name, is_default) VALUES (?, ?, ?)`,
        args: [bank.id, bank.name, bank.isDefault ? 1 : 0],
      });
    }
  }
}
