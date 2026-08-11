import { createClient, Client } from '@libsql/client/web';
import type { VercelRequest } from '@vercel/node';

import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_BANKS } from '../src/constants/defaults';
export { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_BANKS };

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

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN installments INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN installment_number INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN installment_group_id TEXT');
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
      is_default INTEGER DEFAULT 0,
      allow_installments INTEGER DEFAULT 0
    );
  `);

  try {
    await client.execute('ALTER TABLE payment_methods ADD COLUMN allow_installments INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists
  }

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
        sql: `INSERT INTO payment_methods (id, name, is_default, allow_installments) VALUES (?, ?, ?, ?)`,
        args: [pm.id, pm.name, pm.isDefault ? 1 : 0, pm.allowInstallments ? 1 : 0],
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
