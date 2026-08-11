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

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN category_id TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN payment_method_id TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN bank_id TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN store TEXT');
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

  try {
    await client.execute('ALTER TABLE transactions ADD COLUMN subscription_id TEXT');
  } catch (e) {
    // Column already exists
  }

  await client.execute(`
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

  try {
    await client.execute('ALTER TABLE subscriptions ADD COLUMN category_id TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE subscriptions ADD COLUMN payment_method_id TEXT');
  } catch (e) {
    // Column already exists
  }

  try {
    await client.execute('ALTER TABLE subscriptions ADD COLUMN bank_id TEXT');
  } catch (e) {
    // Column already exists
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT CHECK (type IN ('income', 'expense'))
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
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
      name TEXT NOT NULL UNIQUE
    );
  `);
}
